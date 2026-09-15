# Transport Point (TP) Calculation Rules

This document records only the TP calculation rules for transport operations in the browser version of Kantai Collection and the sources behind them; it does not discuss program implementation.

Source check date: 2026-09-01; supplementary check: 2026-09-15.

This document was first recorded during the 2026-09-01 source-recovery check. On that day the Japanese "艦これ攻略 Wiki" and "ぜかましねっと艦これ！" were read and checked, while the English KanColle Wiki could not be re-read because of a Cloudflare restriction, so its content relies on a check summary from an earlier session.

2026-09-15 supplementary check: the full normal-transport and tank-transport tables on "ぜかましねっと艦これ！" were re-read, and the values and inter-source discrepancies listed here all matched that day's reading. On the same day the Japanese "艦これ攻略 Wiki" could not be re-read because of a Cloudflare restriction, and the English KanColle Wiki was not re-checked this time.

## Sources

- [Transport Operation - KanColle Wiki](https://en.kancollewiki.net/Transport_Operation) (English wiki; not re-read on either 2026-09-01 or 2026-09-15)
- [輸送資源量の計算 - 艦これ攻略 Wiki](https://wikiwiki.jp/kancolle/%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E6%B5%B7%E5%9F%9F%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88/%E8%BC%B8%E9%80%81%E8%B3%87%E6%BA%90%E9%87%8F%E3%81%AE%E8%A8%88%E7%AE%97_2019%E7%A7%8B) (Japanese; read on 2026-09-01; re-check blocked on 2026-09-15)
- [TP-輸送資源量-を把握しよう - ぜかましねっと艦これ！](https://zekamashi.net/kancolle-kouryaku/yusou-tp/) (Japanese; read on both 2026-09-01 and 2026-09-15)

## Notation

For the ships and equipment valid at the landing point, define:

```text
ShipBase = sum of ship-type base TP
ItemBase = sum of equipment-category base TP
Base     = ShipBase + ItemBase
```

Kinu Kai Ni additionally grants a `+8` TP bonus equivalent to one Daihatsu landing craft, which is supported by the Japanese source. For a single unarmed Kinu Kai Ni in normal transport, this bonus is added to the light cruiser's own `2` TP, giving `10` TP; the above describes only the single-ship case and does not establish that multiple Kinu Kai Ni would each stack.

## Normal transport

Pre-settlement contribution:

```text
NormalRaw = Base + KinuBonus
```

The source notes that decimals are dropped only at the very end of the whole calculation; you must not floor each ship or each piece of equipment separately and then add them.

All ship-type base values, equipment-category base values, and the Kinu Kai Ni `+8` listed for normal transport are integers, so `NormalRaw` is always an integer. The final result is:

```text
S rank: floor(NormalRaw)
A rank: floor(NormalRaw × 0.7)
B or below: 0
```

Because `NormalRaw` is an integer, `floor(NormalRaw × 0.7)` and `floor(floor(NormalRaw) × 0.7)` are equivalent, so normal transport has no intermediate-rounding-order issue.

### Ship-type base TP

| Ship type | S rank base value |
| --- | ---: |
| Destroyer | 5 |
| Light cruiser | 2 |
| Training cruiser | 6 |
| Aviation cruiser | 4 |
| Aviation battleship | 7 |
| Fleet oiler | 15 |
| Seaplane tender | 9 |
| Landing ship | 12 |
| Submarine aircraft carrier (SSV) | 1 |
| Submarine tender (AS) | 7 |
| Other ship types | 0 |

### Equipment-category base TP

| Equipment category | S rank base value |
| --- | ---: |
| Daihatsu-class and Toku Daihatsu-class landing craft and their tank variants (大発動艇系、特大発動艇系) | 8 |
| Special Type 2 / Type 4 / Type 4 Kai amphibious tanks (特二式内火艇、特四式内火艇、特四式内火艇改) | 2 |
| Drum Can (Transport) (ドラム缶(輸送用)) | 5 |
| Combat rations (戦闘糧食系) | 1 |
| Other equipment | 0 |

Equipment improvement level does not change TP.

## Tank transport / Landing Operation

Tank transport rules depend on the map; a value observed in one event must not be treated as a permanent, universal rule for all maps.

For the rule observed in the 2026 summer event, a `0.75` multiplier is applied uniformly to the normal ship-type base values and equipment-category base values, and the specific-equipment bonus is added on top:

```text
LandingRaw = Base × 0.75 + ItemSpecificBonus
```

According to measured values from the same period, the Kinu Kai Ni `+8` does not participate in the `0.75` scaling in tank transport:

```text
LandingRaw = Base × 0.75 + ItemSpecificBonus + KinuBonus
```

Evidence level: the `+8` itself is supported by the Japanese source; that it is unscaled in tank transport, and that it is counted at most once across the whole combined fleet, are only measured/existing behavior lacking direct source documentation, and remain unconfirmed.

Before settlement, `LandingRaw` is kept unrounded. Neither the rounding timing nor the A-rank intermediate-value order is determined, so we do not assert `floor(LandingRaw × 0.7)` as a confirmed total formula here; the settlement forms mentioned by the sources but not yet confirmed are:

```text
S rank: floor(LandingRaw)
A rank: floor(LandingRaw × 0.7)
B or below: 0
```

### Specific equipment bonus

The "bonus" column below is added on top of `normal category base value × 0.75`. The "tank transport S value" column cross-checks the formula.

| Equipment | Normal base value | Bonus | Tank transport S value |
| --- | ---: | ---: | ---: |
| Daihatsu Landing Craft (R35 & French Infantry) (大発動艇(R35＆フランス兵)) | 8 | 18 | 24 |
| Toku Daihatsu Landing Craft + Type III Tank J (特大発動艇＋III号戦車J型) | 8 | 17 | 23 |
| Toku Daihatsu Landing Craft + Type 1 Gun Tank (特大発動艇＋一式砲戦車) | 8 | 15 | 21 |
| M4A1 DD | 8 | 14 | 20 |
| Toku Daihatsu Landing Craft + 11th Tank Regiment (特大発動艇＋戦車第11連隊) | 8 | 13 | 19 |
| Toku Daihatsu Landing Craft + Chi-Ha Kai (特大発動艇＋チハ改) | 8 | 13 | 19 |
| Toku Daihatsu Landing Craft + Type III Tank (North African Specification) (特大発動艇＋III号戦車(北アフリカ仕様)) | 8 | 13 | 19 |
| Toku Daihatsu Landing Craft + Chi-Ha (特大発動艇＋チハ) | 8 | 11 | 17 |
| Daihatsu Landing Craft (Type II Tank / North African Specification) (大発動艇(II号戦車/北アフリカ仕様)) | 8 | 10 | 16 |
| Daihatsu Landing Craft (Type 89 Tank & Marines) (大発動艇(八九式中戦車＆陸戦隊)) | 8 | 8 | 14 |
| Toku Daihatsu / Daihatsu / Armed Daihatsu / Armored Boat (AB) (特大発動艇、大発動艇、武装大発、装甲艇(AB艇)) | 8 | 0 | 6 |
| Special Type 4 Amphibious Tank Kai (特四式内火艇改) | 2 | 12 | 13.5 |
| Special Type 2 Amphibious Tank (特二式内火艇) | 2 | 11 | 12.5 |
| Special Type 4 Amphibious Tank (特四式内火艇) | 2 | 10 | 11.5 |
| Army Infantry Unit + Chi-Ha Kai (陸軍歩兵部隊＋チハ改) | 0 | 14 | 14 |
| Type 97 Medium Tank New Turret (Chi-Ha Kai) (九七式中戦車 新砲塔(チハ改)) | 0 | 9 | 9 |
| Type 97 Medium Tank (Chi-Ha) (九七式中戦車(チハ)) | 0 | 7 | 7 |
| Army Infantry Unit (陸軍歩兵部隊) | 0 | 5 | 5 |
| Drum Can (Transport) (ドラム缶(輸送用)) | 5 | 0 | 3.75 |
| Combat rations (戦闘糧食系) | 1 | 0 | 0.75 |

Example: the tank transport S value of Daihatsu Landing Craft (R35 & French Infantry) is:

```text
8 × 0.75 + 18 = 24
```

Normal ship-type base values are also multiplied by `0.75`. For example, a destroyer is `5 × 0.75 = 3.75` and a light cruiser is `2 × 0.75 = 1.5`.

## Which ships count toward TP

- Ships that were already heavily damaged or had retreated when entering the landing point, and the equipment they carry, do not count toward this transport's TP.
- Heavy damage or retreat after entering the landing point does not affect the TP already landed.
- Therefore, the fleet state used in the formula should be the state when entering the landing point.

## Inconsistencies between sources

In zekamashi's normal-transport table, a few Daihatsu-class items whose S rank is `8` are written as A rank `3.5`; the same page also states that A rank is `0.7` of S rank, while the 艦これ攻略 Wiki lists these items in a common `8 / 5.6` table. Both bases agree, so we adopt:

```text
8 × 0.7 = 5.6
```

In zekamashi's tank-transport ship-type table, the `0.75` and `5.25` values for the submarine aircraft carrier (SSV) and submarine tender (AS) appear to be swapped. Based on the normal base values `1` and `7` and the table's uniform `0.75` multiplier, this document reads them as follows; this item lacks independent direct confirmation and is treated as a suspected recording issue:

```text
Submarine aircraft carrier (SSV): 1 × 0.75 = 0.75
Submarine tender (AS): 7 × 0.75 = 5.25
```

In addition, a paragraph updated on 2026-08-01 on that page says "2026秋イベントの一例" (an example from the 2026 autumn event), which does not match the update time or the event then current; this appears to be a textual misstatement, lacks independent direct confirmation, and does not affect the multipliers or equipment values in the table.

## Not yet confirmed by the sources

The rounding orders below only matter when non-integer contributions exist, i.e. tank transport (the `0.75` multiplier) and combined-fleet sums; in normal transport every term is an integer, so these issues do not arise.

- Whether a combined fleet is rounded per fleet (main and escort separately, then summed) or summed as raw values and rounded once.
- Whether the combined-fleet A-rank `0.7` applies to the two fleets' combined raw value or to some already-rounded intermediate value.
- In tank transport, whether the Kinu Kai Ni `+8` is unaffected by the map multiplier; it currently has in-game value support but lacks explicit wording in the sources above.

Until direct sources or game data that can distinguish these cases are available, none of these rounding orders should be written as a confirmed rule.
