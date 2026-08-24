import fs from 'fs';

let content = fs.readFileSync('client/src/pages/GestorDashboard.jsx', 'utf8');

const replaceMock = \
  // Process chart data dynamically
  const chartData = useMemo(() => {
    if (!data?.chart || data.chart.length === 0) return [];
    
    let accumulated = 0;
    return data.chart.map(item => {
      accumulated += Number(item.vgv);
      return {
        day: String(item.dia).padStart(2, '0'),
        vgv: accumulated
      };
    });
  }, [data]);
\;

content = content.replace(/\/\/ Mock data for the chart.*?\}\];/s, replaceMock);
content = content.replace(/<AreaChart data=\{mockChartData\}/, '<AreaChart data={chartData}');
content = content.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useMemo } from 'react';");

fs.writeFileSync('client/src/pages/GestorDashboard.jsx', content, 'utf8');
