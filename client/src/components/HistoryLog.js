import React from "react";
export function HistoryLog({ history }) {
  return (
    <div id="history-log">
      <strong>Game History</strong>
      <br /><br />
      {history.map((e, i) => <div key={i}>{e}</div>)}
    </div>
  );
}
