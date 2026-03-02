import { useEffect, useState } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import * as topojson from "topojson-client";

const PRIMARY = "hsl(272, 51%, 37%)";
const PRIMARY_FAINT = "hsla(272, 51%, 37%, 0.2)";

export function WorldMap() {
  const [geographies, setGeographies] = useState([]);
  const [activeCountries, setActiveCountries] = useState(new Set());

  useEffect(() => {
    fetch("/world-110m.json")
      .then((res) => res.json())
      .then((topology) => {
        const countries = topojson.feature(
          topology,
          topology.objects.countries
        );
        setGeographies(countries.features);
      })
      .catch((err) => console.error("Failed to load map data", err));
  }, []);

  useEffect(() => {
    if (geographies.length === 0) return;

    const updateActive = () => {
      const newActive = new Set();
      const count = Math.floor(Math.random() * 8) + 8;
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * geographies.length);
        const id = geographies[randomIndex].id;
        if (id) newActive.add(id);
      }
      setActiveCountries(newActive);
    };

    updateActive();
    const interval = setInterval(updateActive, 2500);
    return () => clearInterval(interval);
  }, [geographies]);

  const projection = geoEqualEarth().scale(160).translate([400, 200]);
  const pathGenerator = geoPath().projection(projection);

  return (
    <div className="lp-worldmap">
      <svg viewBox="0 0 800 400">
        <g stroke="#ffffff" strokeWidth="0.5">
          {geographies.map((geo, i) => {
            const isActive = activeCountries.has(geo.id);
            return (
              <path
                key={`path-${i}`}
                d={pathGenerator(geo) || ""}
                fill={isActive ? PRIMARY : PRIMARY_FAINT}
                opacity={isActive ? 0.9 : 0.8}
              />
            );
          })}
        </g>
      </svg>
      <div className="lp-worldmap__fade" />
    </div>
  );
}
