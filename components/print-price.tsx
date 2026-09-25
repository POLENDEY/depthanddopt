"use client";

import { useMemo, useState } from "react";

const A1_WATTS = 95;
const MARKUPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function money(centavos: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100);
}

function centavos(amount: number) {
  return Math.round(amount * 100);
}

function kwhFor(hours: string, minutes: string) {
  const h = Number(hours);
  const m = Number(minutes);
  const totalMinutes = (Number.isFinite(h) && h > 0 ? h : 0) * 60 + (Number.isFinite(m) && m > 0 ? m : 0);
  const kwh = (A1_WATTS * totalMinutes) / 60000;
  return String(Math.round(kwh * 1_000_000) / 1_000_000);
}

export function PrintPrice() {
  const [grams, setGrams] = useState("");
  const [filamentPerKg, setFilamentPerKg] = useState("");
  const [hours, setHours] = useState("1");
  const [minutes, setMinutes] = useState("0");
  const [kwh, setKwh] = useState("0.095");
  const [rate, setRate] = useState("14.7424");
  const [markup, setMarkup] = useState("30");

  function setPrintHours(value: string) {
    setHours(value);
    setKwh(kwhFor(value, minutes));
  }

  function setPrintMinutes(value: string) {
    setMinutes(value);
    setKwh(kwhFor(hours, value));
  }

  const price = useMemo(() => {
    const weight = Number(grams);
    const filament = Number(filamentPerKg);
    const power = Number(kwh);
    const electric = Number(rate);
    const extra = Number(markup);
    if (![weight, filament, power, electric, extra].every((value) => Number.isFinite(value) && value >= 0)) return null;
    if (weight === 0 && power === 0) return null;
    const material = centavos((weight / 1000) * filament);
    const electricity = centavos(power * electric);
    const base = material + electricity;
    const added = Math.round((base * extra) / 100);
    return { material, electricity, base, added, grand: base + added };
  }, [grams, filamentPerKg, kwh, rate, markup]);

  return (
    <section className="panel price-tool" aria-labelledby="print-price-title">
      <p className="eyebrow">3D printing</p>
      <h2 id="print-price-title">Print price</h2>
      <p className="note">Each amount is rounded to the centavo, then added, so the lines match the grand total. Filament is grams ÷ 1000 × the price per kilogram. Electricity is the kilowatt-hours in the field × the rate. Hours and minutes fill that field from the Bambu Lab A1 average of 95 W on PLA. The rate starts at ₱14.7424 per kWh, Meralco’s September 2026 price for a typical Metro Manila household.</p>
      <div className="price-fields">
        <label>
          Filament weight (grams)
          <input inputMode="decimal" value={grams} onChange={(event) => setGrams(event.target.value)} />
        </label>
        <label>
          Filament price (per kg)
          <input inputMode="decimal" value={filamentPerKg} onChange={(event) => setFilamentPerKg(event.target.value)} />
        </label>
        <label>
          Print time (hours)
          <input inputMode="numeric" value={hours} onChange={(event) => setPrintHours(event.target.value)} />
        </label>
        <label>
          Print time (minutes)
          <input inputMode="numeric" value={minutes} onChange={(event) => setPrintMinutes(event.target.value)} />
        </label>
        <label>
          Electricity used (kWh)
          <input inputMode="decimal" value={kwh} onChange={(event) => setKwh(event.target.value)} />
        </label>
        <label>
          Electricity rate (per kWh)
          <input inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} />
        </label>
        <label>
          Add to the total
          <select value={markup} onChange={(event) => setMarkup(event.target.value)}>
            {MARKUPS.map((percent) => (
              <option key={percent} value={percent}>
                {percent}%
              </option>
            ))}
          </select>
        </label>
      </div>
      {price ? (
        <>
        <dl className="price-result">
          <div>
            <dt>Filament</dt>
            <dd>{money(price.material)}</dd>
          </div>
          <div>
            <dt>Electricity</dt>
            <dd>{money(price.electricity)}</dd>
          </div>
          <div>
            <dt>Base</dt>
            <dd>{money(price.base)}</dd>
          </div>
          <div>
            <dt>{markup}% added</dt>
            <dd>{money(price.added)}</dd>
          </div>
        </dl>
        <p className="price-grand">
          <span>Grand total</span>
          <strong>{money(price.grand)}</strong>
        </p>
        <p className="note">{money(price.material)} + {money(price.electricity)} = {money(price.base)}. {markup}% of that base is {money(price.added)}. Grand total is {money(price.grand)}.</p>
        </>
      ) : (
        <p className="note">Enter the weight, filament price, and electricity to see the price.</p>
      )}
    </section>
  );
}
