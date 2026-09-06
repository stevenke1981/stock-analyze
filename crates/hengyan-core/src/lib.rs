//! Canonical numeric engine for HengYan.
//! Formulas match `src/lib/engine` in the web app. UI must not live here.

pub mod indicators {
    pub fn sma(values: &[Option<f64>], n: usize) -> Vec<Option<f64>> {
        let mut out = vec![None; values.len()];
        if n == 0 {
            return out;
        }
        for i in 0..values.len() {
            if i + 1 < n {
                continue;
            }
            let mut sum = 0.0;
            let mut ok = true;
            for v in values.iter().take(i + 1).skip(i + 1 - n) {
                match v {
                    Some(x) => sum += *x,
                    None => {
                        ok = false;
                        break;
                    }
                }
            }
            if ok {
                out[i] = Some(sum / n as f64);
            }
        }
        out
    }

    pub fn ema(values: &[Option<f64>], n: usize) -> Vec<Option<f64>> {
        let mut out = vec![None; values.len()];
        if n == 0 {
            return out;
        }
        let k = 2.0 / (n as f64 + 1.0);
        let seed = sma(values, n);
        let mut prev: Option<f64> = None;
        for i in 0..values.len() {
            let Some(v) = values[i] else {
                prev = None;
                continue;
            };
            match prev {
                None => {
                    if let Some(s) = seed[i] {
                        prev = Some(s);
                        out[i] = Some(s);
                    }
                }
                Some(p) => {
                    let nxt = v * k + p * (1.0 - k);
                    prev = Some(nxt);
                    out[i] = Some(nxt);
                }
            }
        }
        out
    }
}

pub mod portfolio {
    #[derive(Clone, Debug)]
    pub struct Txn {
        pub side: &'static str,
        pub shares: f64,
        pub price: f64,
        pub fee: f64,
        pub tax: f64,
    }

    #[derive(Clone, Debug, Default)]
    pub struct Position {
        pub shares: f64,
        pub cost: f64,
        pub realized: f64,
    }

    pub fn apply(txns: &[Txn]) -> Position {
        let mut p = Position::default();
        for t in txns {
            match t.side {
                "buy" => {
                    p.cost += t.price * t.shares + t.fee + t.tax;
                    p.shares += t.shares;
                }
                "sell" => {
                    let sell = t.shares.min(p.shares);
                    let avg = if p.shares > 0.0 { p.cost / p.shares } else { 0.0 };
                    let proceeds = t.price * sell - t.fee - t.tax;
                    p.realized += proceeds - avg * sell;
                    p.shares -= sell;
                    p.cost = avg * p.shares;
                    if p.shares <= 1e-9 {
                        p.shares = 0.0;
                        p.cost = 0.0;
                    }
                }
                "dividend" => {
                    let cash = if t.shares > 0.0 { t.price * t.shares } else { t.price };
                    p.realized += cash - t.fee - t.tax;
                }
                _ => {}
            }
        }
        p
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sma_warmup() {
        let v: Vec<Option<f64>> = (1..=5).map(|x| Some(x as f64)).collect();
        let s = indicators::sma(&v, 3);
        assert_eq!(s[0], None);
        assert_eq!(s[2], Some(2.0));
        assert_eq!(s[4], Some(4.0));
    }

    #[test]
    fn average_cost() {
        let p = portfolio::apply(&[
            portfolio::Txn { side: "buy", shares: 1000.0, price: 100.0, fee: 100.0, tax: 0.0 },
            portfolio::Txn { side: "buy", shares: 1000.0, price: 120.0, fee: 100.0, tax: 0.0 },
            portfolio::Txn { side: "sell", shares: 1000.0, price: 130.0, fee: 100.0, tax: 390.0 },
        ]);
        assert!((p.shares - 1000.0).abs() < 1e-9);
        let avg = (1000.0 * 100.0 + 100.0 + 1000.0 * 120.0 + 100.0) / 2000.0;
        assert!((p.cost / p.shares - avg).abs() < 1e-9);
    }
}
