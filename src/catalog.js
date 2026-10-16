/* Verified chart listings, sourced 2026-10-16. Lyrics links open provider search results,
   NOT a claim that any song's lyrics are licensed or hosted by LyricVerse. */
const rawChartSongs = [
  {
    "id": "patient-zero",
    "title": "Patient Zero",
    "artist": "Taylor Swift",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Patient%20Zero%20Taylor%20Swift",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "choosin-texas",
    "title": "Choosin' Texas",
    "artist": "Ella Langley",
    "genre": "Country",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Choosin'%20Texas%20Ella%20Langley",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "boston",
    "title": "Boston",
    "artist": "Stella Lefty",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Boston%20Stella%20Lefty",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "been-by-now",
    "title": "Been By Now",
    "artist": "Morgan Wallen",
    "genre": "Country",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Been%20By%20Now%20Morgan%20Wallen",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "solar-eclipse",
    "title": "Solar Eclipse",
    "artist": "Drake & Don Toliver",
    "genre": "Hip-Hop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Solar%20Eclipse%20Drake%20%26%20Don%20Toliver",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "dracula",
    "title": "Dracula",
    "artist": "Tame Impala & JENNIE",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Dracula%20Tame%20Impala%20%26%20JENNIE",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "hate-that-i-made-you-love-me",
    "title": "Hate That I Made You Love Me",
    "artist": "Ariana Grande",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Hate%20That%20I%20Made%20You%20Love%20Me%20Ariana%20Grande",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "stupid-song",
    "title": "Stupid Song",
    "artist": "Olivia Rodrigo",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Stupid%20Song%20Olivia%20Rodrigo",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "nicole-kidman",
    "title": "Nicole Kidman",
    "artist": "ADELA",
    "genre": "Pop",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Nicole%20Kidman%20ADELA",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "bby-wow",
    "title": "BbY WOW",
    "artist": "Karol G With Judeline & rusowsky",
    "genre": "Pop",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=BbY%20WOW%20Karol%20G%20With%20Judeline%20%26%20rusowsky",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "i-just-might",
    "title": "I Just Might",
    "artist": "Bruno Mars",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=I%20Just%20Might%20Bruno%20Mars",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "babydoll",
    "title": "Babydoll",
    "artist": "Dominic Fike",
    "genre": "Indie",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Babydoll%20Dominic%20Fike",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "risk-it-all",
    "title": "Risk It All",
    "artist": "Bruno Mars",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Risk%20It%20All%20Bruno%20Mars",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "midnight-sun",
    "title": "Midnight Sun",
    "artist": "Zara Larsson",
    "genre": "Pop",
    "language": "en",
    "chart": "Hot 100",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Midnight%20Sun%20Zara%20Larsson",
    "sourceUrl": "https://ca.billboard.com/charts/hot-100"
  },
  {
    "id": "the-cure",
    "title": "The Cure",
    "artist": "Olivia Rodrigo",
    "genre": "Pop",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=The%20Cure%20Olivia%20Rodrigo",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "ordinary",
    "title": "Ordinary",
    "artist": "Alex Warren",
    "genre": "Pop",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Ordinary%20Alex%20Warren",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "man-i-need",
    "title": "Man I Need",
    "artist": "Olivia Dean",
    "genre": "R&B",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Man%20I%20Need%20Olivia%20Dean",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "the-fate-of-ophelia",
    "title": "The Fate Of Ophelia",
    "artist": "Taylor Swift",
    "genre": "Pop",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=The%20Fate%20Of%20Ophelia%20Taylor%20Swift",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "die-with-a-smile",
    "title": "Die With A Smile",
    "artist": "Lady Gaga & Bruno Mars",
    "genre": "Pop",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Die%20With%20A%20Smile%20Lady%20Gaga%20%26%20Bruno%20Mars",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "iris",
    "title": "Iris",
    "artist": "Goo Goo Dolls",
    "genre": "Rock",
    "language": "en",
    "chart": "Global 200",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Iris%20Goo%20Goo%20Dolls",
    "sourceUrl": "https://ca.billboard.com/charts/billboard-global-200"
  },
  {
    "id": "ashke",
    "title": "Ashke",
    "artist": "Karan Aujla",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Ashke%20Karan%20Aujla",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "bhangra-bhangra-bhangra",
    "title": "Bhangra Bhangra Bhangra",
    "artist": "G Sidhu",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Bhangra%20Bhangra%20Bhangra%20G%20Sidhu",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "i-m-an-artist-bro",
    "title": "I'm an Artist Bro",
    "artist": "Diljit Dosanjh",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=I'm%20an%20Artist%20Bro%20Diljit%20Dosanjh",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "jatt-koke-ton-sohna",
    "title": "Jatt Koke Ton Sohna",
    "artist": "Amar Sehmbi",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Jatt%20Koke%20Ton%20Sohna%20Amar%20Sehmbi",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "kokke",
    "title": "Kokke",
    "artist": "Jass Sandhu & Miss Pooja",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Kokke%20Jass%20Sandhu%20%26%20Miss%20Pooja",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "langhi-haske",
    "title": "Langhi Haske",
    "artist": "Harinder Harvi",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Langhi%20Haske%20Harinder%20Harvi",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "jawab-de-geya",
    "title": "Jawab De Geya",
    "artist": "Deep Bajwa",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Jawab%20De%20Geya%20Deep%20Bajwa",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "hazir",
    "title": "Hazir",
    "artist": "Amrinder Gill",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Hazir%20Amrinder%20Gill",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "pyaar",
    "title": "Pyaar",
    "artist": "Jasmine Sandlas",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "Punjabi Top 20",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Pyaar%20Jasmine%20Sandlas",
    "sourceUrl": "https://www.simplybhangra.com/news/bhangra-news/14756-the-official-simplybhangra-com-panjab-radio-top-10-chart.html"
  },
  {
    "id": "for-a-reason",
    "title": "For A Reason",
    "artist": "Karan Aujla & Ikky",
    "genre": "Punjabi",
    "language": "pa",
    "chart": "India Top Songs",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=For%20A%20Reason%20Karan%20Aujla%20%26%20Ikky",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "arz-kiya-hai",
    "title": "Arz Kiya Hai",
    "artist": "Anuv Jain",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Arz%20Kiya%20Hai%20Anuv%20Jain",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "gehra-hua",
    "title": "Gehra Hua",
    "artist": "Shashwat Sachdev & Arijit Singh",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Gehra%20Hua%20Shashwat%20Sachdev%20%26%20Arijit%20Singh",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "mann-mera",
    "title": "Mann Mera",
    "artist": "Gajendra Verma",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Mann%20Mera%20Gajendra%20Verma",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "finding-her",
    "title": "Finding Her",
    "artist": "Kushagra & Bharath & Saaheal",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Finding%20Her%20Kushagra%20%26%20Bharath%20%26%20Saaheal",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "samjhawan",
    "title": "Samjhawan",
    "artist": "Arijit Singh & Shreya Ghoshal",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Samjhawan%20Arijit%20Singh%20%26%20Shreya%20Ghoshal",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "tum-ho-toh",
    "title": "Tum Ho Toh",
    "artist": "Vishal Mishra & Hansika Pareek",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Tum%20Ho%20Toh%20Vishal%20Mishra%20%26%20Hansika%20Pareek",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "sahiba",
    "title": "Sahiba",
    "artist": "Aditya Rikhari",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Sahiba%20Aditya%20Rikhari",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "jo-tum-mere-ho",
    "title": "Jo Tum Mere Ho",
    "artist": "Anuv Jain",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Jo%20Tum%20Mere%20Ho%20Anuv%20Jain",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "saiyaara",
    "title": "Saiyaara",
    "artist": "Tanishk Bagchi & Faheem Abdullah",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Saiyaara%20Tanishk%20Bagchi%20%26%20Faheem%20Abdullah",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "apna-bana-le",
    "title": "Apna Bana Le",
    "artist": "Sachin-Jigar & Arijit Singh",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Apna%20Bana%20Le%20Sachin-Jigar%20%26%20Arijit%20Singh",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "agar-tum-saath-ho",
    "title": "Agar Tum Saath Ho",
    "artist": "Arijit Singh & Alka Yagnik",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Agar%20Tum%20Saath%20Ho%20Arijit%20Singh%20%26%20Alka%20Yagnik",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "tum-se-hi",
    "title": "Tum Se Hi",
    "artist": "Mohit Chauhan",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Tum%20Se%20Hi%20Mohit%20Chauhan",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "tum-hi-ho",
    "title": "Tum Hi Ho",
    "artist": "Arijit Singh & Mithoon",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#132d5b",
      "#6956ba",
      "#9fc9e9"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Tum%20Hi%20Ho%20Arijit%20Singh%20%26%20Mithoon",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "husn",
    "title": "Husn",
    "artist": "Anuv Jain",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#213b76",
      "#3e77ba",
      "#b8c9ee"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Husn%20Anuv%20Jain",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  },
  {
    "id": "chaleya",
    "title": "Chaleya",
    "artist": "Anirudh Ravichander & Arijit Singh",
    "genre": "Hindi Pop",
    "language": "hi",
    "chart": "India Top Songs",
    "cover": [
      "#312a72",
      "#8b4d9f",
      "#e4a1cf"
    ],
    "lyricsSearchUrl": "https://genius.com/search?q=Chaleya%20Anirudh%20Ravichander%20%26%20Arijit%20Singh",
    "sourceUrl": "https://soundcharts.com/en/charts/spotify/india"
  }
];
// Curated editorial photography for discovery cards. These are NOT official album covers.
// Pexels free-to-use photographs: https://www.pexels.com/license/
// Distinct subjects and genre pools prevent repeated generic vinyl/gradient thumbnails.
// Image failures are handled by the coverHTML SVG fallback.
const EDITORIAL_PHOTO_IDS = {
 Pop:[1763075,1190297,1699161,2747449,1540406,167491,2240771,1105666,210922,164938],
 Country:[167964,2479312,2253879,1005417,1366919,1181406],
 'Hip-Hop':[164745,258283,167636,1190297,1763075,1105666],
 Indie:[1389429,164938,1699161,167491,210922,1540406],
 'R&B':[2240771,1190297,1763075,167964,1699161,164745],
 Rock:[1105666,167636,164745,1699161,1190297,210922],
 Punjabi:[2747449,1540406,2240771,167491,1763075,1190297,1699161,210922],
 'Hindi Pop':[1699161,1190297,2747449,1763075,2240771,1540406,167491,210922,164938,167964]
};
const TITLE_PHOTO_IDS = {
 'solar-eclipse':1366919,'midnight-sun':1366919,'boston':466685,'dracula':619419,
 'the-fate-of-ophelia':167964,'die-with-a-smile':1190297,'iris':1389429,
 'finding-her':1699161,'husn':167491,'pyaar':2240771
};
const genreCounters=new Map();
const chartSongs=rawChartSongs.map(song=>{
 const pool=EDITORIAL_PHOTO_IDS[song.genre]||EDITORIAL_PHOTO_IDS.Pop;
 const index=genreCounters.get(song.genre)||0;
 genreCounters.set(song.genre,index+1);
 const photoId=TITLE_PHOTO_IDS[song.id]||pool[index%pool.length];
 return {...song,thumbnailUrl:`https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=480&h=480&fit=crop`,imageSource:'Pexels',imageType:'editorial'};
});
export const topSongs=chartSongs.filter(song=>song.chart==='Hot 100'||song.chart==='Global 200');
export const hindiSongs=chartSongs.filter(song=>song.language==='hi');
export const punjabiSongs=chartSongs.filter(song=>song.language==='pa');
export const newSongs=[...punjabiSongs,...hindiSongs];
export const readerSong=topSongs[0];
export const hindiDemoLyrics={};
export const allSongs = [...topSongs,...punjabiSongs,...hindiSongs];
export const genresHindi = ['All','Hindi-English Mix','Hindi Pop','Punjabi'];
export const genresDesktop = ['All','Hindi-English Mix','Pop','Rock','Hip-Hop','R&B','Indie','Country','Hindi Pop','Punjabi'];
export const genresMobile = ['All','Hindi-English Mix','Pop','Hip-Hop','Hindi Pop','Punjabi'];
export const originalDemoLyrics=[];
export function findSongs(query){const q=String(query??'').trim().normalize('NFC').toLocaleLowerCase();return !q?[]:allSongs.filter(s=>[s.title,s.artist,s.genre,s.chart].filter(Boolean).some(k=>k.normalize('NFC').toLocaleLowerCase().includes(q)));}
