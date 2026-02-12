import React from "react";

export default function PetCards({ onPick }) {
  return (
    <div className="petCards">
      <button className="petCard" onClick={() => onPick?.("cachorro")}>
        <div className="petIcon">🐶</div>
        <div className="petLabel">Cães</div>
      </button>

      <button className="petCard" onClick={() => onPick?.("gato")}>
        <div className="petIcon">🐱</div>
        <div className="petLabel">Gatos</div>
      </button>
    </div>
  );
}
