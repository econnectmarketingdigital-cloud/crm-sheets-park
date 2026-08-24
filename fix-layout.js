const fs = require('fs');
let content = fs.readFileSync('client/src/components/Layout.jsx', 'utf8');

// Fix encoding issues
content = content.replace(/Neg.*?cios Imobili.*?rios/ig, 'Negócios Imobiliários');
content = content.replace(/Im.*?veis/g, 'Imóveis');
content = content.replace(/Rod.*?zio/g, 'Rodízio');
content = content.replace(/In.*?cio/g, 'Início');

// Make sure Meu Perfil is in navLinks
if (!content.includes('/perfil')) {
  content = content.replace(
    /{ to: '\/empreendimentos', icon: <HiOfficeBuilding size={24} \/>, label: 'Imóveis' },/,
    { to: '/empreendimentos', icon: <HiOfficeBuilding size={24} />, label: 'Imóveis' },\n    { to: '/perfil', icon: <FiUser size={24} />, label: 'Meu Perfil' },
  );
}

// Add overflow to sidebar nav
content = content.replace(
  /<nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>/,
  <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
);

fs.writeFileSync('client/src/components/Layout.jsx', content, 'utf8');
console.log('Fixed Layout.jsx');
