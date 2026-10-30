import { obj } from "../core.js";
import { S } from "../../game/state.js";
import { B, bbox } from "../../engine/draw.js";
import { openBills } from "../../ui/bills.js";

obj({ id: "mail", area: () => S.bills.length ? bbox([B(9.15, 0.25, 0.75, 0.7, 0.05, "")]) : null, spot: [9.5, 1.3],
  act: () => openBills() });
