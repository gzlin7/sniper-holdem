import React from "react";
export function BlindsInfo({ smallBlind, bigBlind }) {
  return (
    <div id="blinds-info">
      Blinds: Small ${smallBlind} / Big ${bigBlind}
    </div>
  );
}
