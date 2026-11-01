import { normalizeColor, rgba, hexToHsv, hsvToHex } from "./core.js";

export const STRINGS = {
  de: { color:"Farbe", alpha:"Deckkraft", hue:"Farbton", plane:"Sättigung und Helligkeit", hex:"HEX-Farbe",
    theme:"Theme-Farbe", done:"Übernehmen", cancel:"Abbrechen", edit:"Farbe für", saved:"Farben pro Benutzer synchronisiert",
    unavailable:"Seitenleistenfarben konnten nicht geladen werden. Dialog schließen und erneut öffnen.",
    conflict:"Einstellungen wurden auf einem anderen Gerät geändert. Bitte schließen und neu öffnen.",
    error:"Änderungen konnten nicht sicher gespeichert werden. Entwurf bleibt offen. Bitte Verbindung prüfen.",
    incompatible:"Seitenleistenfarben: Diese HA-Oberfläche wird noch nicht unterstützt.",
    busy:"Änderungen werden gespeichert …", transparent:"Vollständig transparent", reset:"Auf Theme-Farbe zurücksetzen" },
  en: { color:"Color", alpha:"Opacity", hue:"Hue", plane:"Saturation and brightness", hex:"HEX color",
    theme:"Theme color", done:"Apply", cancel:"Cancel", edit:"Color for", saved:"Colors synced per user",
    unavailable:"Sidebar colors could not be loaded. Close and reopen this dialog.",
    conflict:"Settings changed on another device. Please close and reopen this dialog.",
    error:"Changes could not be saved safely. Your draft remains open. Please check the connection.",
    incompatible:"Sidebar colors: This HA interface is not supported yet.",
    busy:"Saving changes …", transparent:"Fully transparent", reset:"Reset to theme color" },
  fr: { color:"Couleur", alpha:"Opacité", hue:"Teinte", plane:"Saturation et luminosité", hex:"Couleur HEX",
    theme:"Couleur du thème", done:"Appliquer", cancel:"Annuler", edit:"Couleur de", saved:"Couleurs synchronisées par utilisateur",
    unavailable:"Impossible de charger les couleurs. Fermez puis rouvrez cette fenêtre.",
    conflict:"Les réglages ont changé sur un autre appareil. Fermez puis rouvrez cette fenêtre.",
    error:"Enregistrement des modifications non confirmé. Votre brouillon reste ouvert. Vérifiez la connexion.",
    incompatible:"Couleurs du menu : cette interface HA n’est pas encore prise en charge.",
    busy:"Enregistrement des modifications …", transparent:"Entièrement transparent", reset:"Rétablir la couleur du thème" }
};
export const strings = hass => STRINGS[(hass?.language || hass?.locale?.language || "en").split("-")[0]] || STRINGS.en;

export class SidebarColorPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:"open"});
    this.shadowRoot.innerHTML = `<style>
      :host{color:var(--primary-text-color,#eee);font-family:var(--ha-font-family-body,Arial,sans-serif)}
      dialog{color:inherit;background:var(--card-background-color,#222);border:1px solid var(--divider-color,#666);border-radius:16px;padding:20px;width:320px;max-width:calc(100vw - 56px);box-shadow:0 12px 40px #0008}
      dialog::backdrop{background:#0005}h3{font-size:17px;margin:0 0 16px;overflow-wrap:anywhere}
      .sv{position:relative;height:160px;border-radius:8px;touch-action:none;outline-offset:3px;background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),var(--hue)}
      .cursor{position:absolute;width:12px;height:12px;border:2px solid white;border-radius:50%;box-shadow:0 0 2px #000;transform:translate(-50%,-50%);pointer-events:none}
      label{display:block;font-size:13px;margin-top:12px}input[type=range]{width:100%;margin:10px 0 0;accent-color:var(--primary-color,#03a9f4)}
      .hue{appearance:none;height:14px;border-radius:8px;background:linear-gradient(to right,red,#ff0,#0f0,#0ff,#00f,#f0f,red)}
      .checker{background-color:#fff;background-image:conic-gradient(#aaa 25%,transparent 0 50%,#aaa 0 75%,transparent 0);background-size:12px 12px}
      .alpha-track{border-radius:8px;margin-top:8px}.alpha-track input{appearance:none;height:14px;border-radius:8px;margin:0;display:block;background:linear-gradient(to right,transparent,var(--solid))}
      .fields{display:flex;gap:12px;align-items:end}.fields label{flex:1;min-width:0}.fields input{box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--divider-color,#777);border-radius:6px;background:var(--primary-background-color,#181818);color:inherit;font:inherit;margin-top:6px}
      .preview{margin:14px 0 0;border-radius:6px;overflow:hidden}.preview span{display:block;height:28px;background:var(--value)}
      .warn{font-size:12px;color:var(--warning-color,#ffb74d);min-height:16px;margin-top:6px}
      footer{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}button{font:inherit;color:var(--primary-color,#03a9f4);background:transparent;border:1px solid var(--divider-color,#777);border-radius:8px;padding:8px 10px;min-height:40px;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}.theme{margin-right:auto}
    </style><dialog aria-labelledby="title"><h3 id="title"></h3>
      <div class="sv" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="cursor"></span></div>
      <label class="hue-label"><span></span><input class="hue" type="range" min="0" max="360" step="1"></label>
      <label class="alpha-label"><span></span><div class="alpha-track checker"><input class="alpha" type="range" min="0" max="100" step="1"></div></label>
      <div class="fields"><label class="hex-label"><span></span><input class="hex" type="text" maxlength="7" spellcheck="false" pattern="#[0-9a-fA-F]{6}"></label>
      <label class="opacity-label"><span></span><input class="opacity" type="number" min="0" max="100" step="1"></label></div>
      <div class="preview checker"><span></span></div><div class="warn" role="status"></div>
      <footer><button class="theme" type="button"></button><button class="cancel" type="button"></button><button class="done" type="button"></button></footer>
    </dialog>`;
    const $ = selector => this.shadowRoot.querySelector(selector);
    this.$ = $;
    $(".hue").addEventListener("input", e => {this.hsv[0] = Number(e.target.value); this.change();});
    $(".alpha").addEventListener("input", e => {this.color.alpha = Number(e.target.value); this.change();});
    $(".opacity").addEventListener("input", e => {
      if (e.target.validity.valid && e.target.value !== "") {this.color.alpha = Number(e.target.value); this.change();}
    });
    $(".hex").addEventListener("input", e => {
      const c = normalizeColor({hex:e.target.value,alpha:this.color.alpha});
      e.target.setCustomValidity(c ? "" : "#RRGGBB");
      if (c) {this.color = c; this.hsv = hexToHsv(c.hex); this.change();}
    });
    const plane = $(".sv");
    const move = e => {
      const rect = plane.getBoundingClientRect();
      this.hsv[1] = Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
      this.hsv[2] = 1-Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height)); this.change();
    };
    plane.addEventListener("pointerdown", e => {plane.setPointerCapture(e.pointerId); move(e);});
    plane.addEventListener("pointermove", e => {if(plane.hasPointerCapture(e.pointerId))move(e);});
    plane.addEventListener("keydown", e => {
      if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;
      e.preventDefault(); e.stopPropagation();
      if(e.key==="ArrowLeft")this.hsv[1]=Math.max(0,this.hsv[1]-.01);
      if(e.key==="ArrowRight")this.hsv[1]=Math.min(1,this.hsv[1]+.01);
      if(e.key==="ArrowDown")this.hsv[2]=Math.max(0,this.hsv[2]-.01);
      if(e.key==="ArrowUp")this.hsv[2]=Math.min(1,this.hsv[2]+.01);
      this.change();
    });
    $(".theme").addEventListener("click",()=>{this.onChange(null);this.finish();});
    $(".cancel").addEventListener("click",()=>this.cancel());
    $(".done").addEventListener("click",()=>{
      if($(".hex").reportValidity() && $(".opacity").reportValidity())this.finish();
    });
    $("dialog").addEventListener("cancel",e=>{e.preventDefault();e.stopPropagation();this.cancel();});
    $("dialog").addEventListener("keydown",e=>e.stopPropagation());
  }
  show({label,color,hass,onChange}) {
    this.text = strings(hass); this.original = color ? {...color} : null;
    this.color = color ? {...color} : {hex:"#03a9f4",alpha:100}; this.onChange=onChange;
    this.hsv=hexToHsv(this.color.hex);
    this.$("#title").textContent=`${this.text.edit} ${label}`;
    for(const [selector,key] of [[".hue-label span","hue"],[".alpha-label span","alpha"],[".hex-label span","hex"],[".opacity-label span","alpha"],[".theme","theme"],[".cancel","cancel"],[".done","done"]])this.$(selector).textContent=this.text[key];
    this.$(".sv").setAttribute("aria-label",this.text.plane);
    this.$(".hex").setCustomValidity(""); this.render();
    this.$("dialog").showModal(); this.$(".hex").focus();
  }
  render() {
    const [h,s,v]=this.hsv;
    this.$(".sv").style.setProperty("--hue",hsvToHex(h,1,1));
    this.$(".sv").setAttribute("aria-valuenow",String(Math.round(s*100)));
    this.$(".sv").setAttribute("aria-valuetext",`${Math.round(s*100)}% / ${Math.round(v*100)}%`);
    this.$(".cursor").style.left=`${s*100}%`;this.$(".cursor").style.top=`${(1-v)*100}%`;
    this.$(".hue").value=h; this.$(".alpha").value=this.color.alpha;
    this.$(".opacity").value=this.color.alpha; this.$(".hex").value=this.color.hex;
    this.$(".alpha-track").style.setProperty("--solid",this.color.hex);
    this.$(".preview").style.setProperty("--value",rgba(this.color));
    this.$(".warn").textContent=this.color.alpha===0?this.text.transparent:"";
  }
  change(){this.color.hex=hsvToHex(...this.hsv);this.render();this.onChange({...this.color});}
  cancel(){this.onChange(this.original);this.finish();}
  finish(){this.$("dialog").close();this.remove();}
}
