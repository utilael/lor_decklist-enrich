const { DeckEncoder } = require('./runeterra-bandle-city');
const fs = require('fs');

const myArgs = process.argv.slice(2);
if (!myArgs[0]) { return; }
const fileName = myArgs[0];

const data = { 
	cards: [], 	// All cards
	core: {}, 	// Core data globals
	regions: {},// Region text with emojis by region abbreviation, e.g. { 'SH': `${SH_Emoji} Shurima` }
	emojis: {} 	// All the emojis the bot has access to
};

const setNumbers = Array(5).fill().map((_, i) => i + 1);
setNumbers.forEach(i => {
	const fileData = fs.readFileSync('./data/set' + i + '-en_us.json');

	const json = JSON.parse(fileData);
	data.cards.push(...json);
});

const csvFile = fs.readFileSync(fileName).toString();
// console.log(csvFile);
const lines = csvFile.split('\r\n');
// console.log(lines[0]);
const header = lines[0].split(',');
const values = lines.slice(1);

const newLines = [];
const headerFirstHalf = header.slice(0,header.length - 3);
newLines.push(
	[...headerFirstHalf, 'Champion 1', 'Champion 2', 'Champion 3', 'Region 1', 'Region 2', 'Deck Code', 'Mobalytics Link']
	.join(',')
);


values.forEach(value => {
	const split = value.split(',');
	const firstHalf = split.slice(0, split.length - 3);
	const decks = split.slice(split.length - 3).map(deck => deck.replace(/"/g, '').trim());
	decks.forEach(deck => {
		if (!deck) { return [...firstHalf, '', '', '', '', '', '', ''].join(','); }
		try {
			const { champions, regions } = getDeckInfo(deck);
			newLines.push(
				[...firstHalf, champions[0] || '', champions[1] || '', champions[2] || '', regions[0] || '', regions[1] || '', deck, 'https://lor.mobalytics.gg/decks/code/' + deck]
				.join(',')
			);
		}
		catch {
			newLines.push(
				[...firstHalf, 'INVALID', '', '', '', '', 'deck', 'https://lor.mobalytics.gg/decks/code/' + deck]
				.join(',')
			);
		}
	});
});

// console.log(newLines);

fs.writeFileSync(fileName + '_out.csv', newLines.join('\r\n'));

function getDeckInfo(code) {
	const deck = DeckEncoder.decode(code);

	// console.log(deck);

	// Champions
	const champions = deck.reduce((list, card) => {
		const _card = data.cards.find(_card => _card.cardCode === card.code);
		if (_card.rarity === 'Champion') {
			return [ ...list, _card];
		}
		return list;
	}, []);

	// const championsString = champions.map(champ => champ.name).join('/');
	// console.log(championsString);

	// Regions
	const allRegions = deck.reduce((list, card) => {
		const _card = data.cards.find(_card => _card.cardCode === card.code);
		return [...list, _card.regions];
	}, []);
	// console.log(allRegions);

	const regions = [... new Set(allRegions.filter(regions => regions.length === 1).map(regions => regions[0]))];

	// console.log(regions);
	
	return { champions: champions.map(champ => champ.name), regions };
}