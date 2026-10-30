import { obj } from "../core.js";
import { B, bbox, pick } from "../../engine/draw.js";
import { answerCall, ringing } from "../../ui/phone.js";
import { say } from "../../characters/dex.js";

obj({ id: "phone", area: () => bbox([B(10.05, 0, 0.27, 0, 0.45, "", 1.1)]), spot: [10.2, 0.9],
  act: () => ringing ? answerCall() : say(pick(["Tom de discagem. Ninguém liga mais.", "Alô? ...Só estática.", "Disquei o número da Lena. Fora de serviço."])) });
