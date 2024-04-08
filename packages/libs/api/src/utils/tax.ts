import FormData from 'form-data';
import {load} from 'cheerio';

const pricePattern = /[. €]/ig;
const spacePattern = /\s+/ig;

const createFormData = (value : number) => {
  // create form data
  return {
    "MIME Type": 'application/x-www-form-urlencoded',
    f_start: '1',
    ok: '1',
    f_bruttolohn: `${value}`,
    f_abrechnungszeitraum: 'monat',
    f_geld_werter_vorteil: '0',
    f_abrechnungsjahr: '2024',
    f_steuerfreibetrag: '0',
    f_steuerklasse: '4',
    f_kirche: 'nein',
    f_bundesland: 'rheinland-pfalz',
    f_alter: '40',
    f_kinder: 'nein',
    f_kinderfreibetrag: '0',
    f_kinder_anz: '0',
    f_krankenversicherung: 'freiwillig_versichert',
    f_private_kv: '',
    f_arbeitgeberzuschuss_pkv: 'ja',
    f_KVZ: '1.7',
    f_rentenversicherung: 'pflichtversichert',
    f_arbeitslosenversicherung: 'pflichtversichert',
  }
}

export const getSalary = async function () {
  const body = await fetch(
    'https://www.brutto-netto-rechner.info/', {
      method: 'POST',
      body: new URLSearchParams(createFormData(9000)),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
    }
  );
  // parse html
  const $ = load(await body.text());
  // find results
  const res = $('.rechner')
    .text()
    .match(/Netto:\s*([0-9.,]*)\s*€\s*([0-9.,]*)\s*€/);
  if (!res)
    return;
  // parse numbers
  const monthly = Number.parseFloat(res[1].replace('.', '').replace(',', '.'));
  const annually = Number.parseFloat(res[2].replace('.', '').replace(',', '.'));
  return {monthly, annually};
}
