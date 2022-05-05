import { createClapback } from "./clapback.js";

let cb = createClapback(8012)

cb.listen(() => {
    console.log("voltei");
    //console.log(cb.getDbs());
})