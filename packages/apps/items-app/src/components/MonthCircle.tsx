import {useEffect, useState} from "react";

const Months = Array.from(Array(12).keys());
const styleFilled = {fill: 'gray', fillOpacity: 0.4, stroke: 'black', strokeWidth: 1};
const styleFilledNext = {fill: 'orange', fillOpacity: 1, stroke: 'black', strokeWidth: 1};
const styleUnfilled = {fill: 'none', stroke: 'black', strokeWidth: 1};
const styleTest = {fill: 'black', font: "bold 18px serif"}

export default function MonthCircle({months, next}: { months: boolean[], next: number }) {

  const [styles, setStyles] = useState(Array(12).fill(styleUnfilled));
  const monthChars = 'JFMAMJJASOND';

  useEffect(() => {

    // define styles: set all to disabled
    let s = months.map(m => (m ? styleFilled : styleUnfilled));

    // special layout for next month
    s[next] = styleFilledNext;

    // update styles
    setStyles(s);

  }, [months, next]);

  return (
    <svg
      width="10mm"
      height="10mm"
      viewBox="0 0 44 47"
      version="1.1"
      id="months"
      xmlns="http://www.w3.org/2000/svg">
      {
        Months.map((i) => (
          <g key={i} transform={"rotate(" + (i * 30) + " 21.85 21.85) translate(-41.600832,-62.867499)"}>
            <path
              style={styles[i]}
              d="m 63.499998,63.499999 v 10.583334 c 1.857762,-10e-7 3.682795,0.489015 5.291665,1.417898 L 74.08333,66.335796 C 70.86559,64.478032 67.215523,63.499999 63.499998,63.499999 Z"/>
          </g>
        ))
      }
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" style={styleTest}>{monthChars[next]}</text>
    </svg>
  )

}

