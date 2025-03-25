const colors = [
    { id: 'Noir et blanc', style: 'linear-gradient(45deg, #000000, #ffffff)' },
    { id: 'Couleurs vives', style: 'conic-gradient(#ff5733, #ffc300, #28a745, #17a2b8, #6f42c1, #ff5733)' },
    { id: 'Couleurs sombres', style: 'conic-gradient(#4a322f, #3f522d, #2d4a4a, #2f2f4a, #4a2d4a, #4a322f)' },
    { id: 'Rouge', style: 'linear-gradient(to right, rgba(255, 0, 0, 0.5), rgba(255, 0, 0, 0.8))' },
    { id: 'Bleu', style: 'linear-gradient(to right, rgba(0, 0, 255, 0.5), rgba(0, 0, 255, 0.8))' },
    { id: 'Vert', style: 'linear-gradient(to right, rgba(0, 255, 0, 0.5), rgba(0, 255, 0, 0.8))' },
];

const luminosities = [
    { id: 'Image sombre', color: '#000', text: 'Sombre', textColor: '#fff' },
    { id: 'Image claire', color: '#ababab', text: 'Clair', textColor: '#000' },
];

export {
    colors,
    luminosities,
}

