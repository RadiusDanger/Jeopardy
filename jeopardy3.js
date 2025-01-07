const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; // The URL of the API.
const NUMBER_OF_CATEGORIES = 5; // The number of categories you will be fetching.
const NUMBER_OF_CLUES_PER_CATEGORY = 5; // The number of clues you will be displaying per category.

let categories = []; // The categories with clues fetched from the API.
let activeClue = null; // Currently selected clue data.
let activeClueMode = 0; // Controls the flow of #active-clue element.
let isPlayButtonClickable = true; // Prevents the button from being clicked during the game.

$("#play").on("click", handleClickOfPlay);
// Makes start button not clickable once clicked
async function handleClickOfPlay() {
  if (isPlayButtonClickable) {
    isPlayButtonClickable = false;
    await setupTheGame();
  }
}

async function setupTheGame() {
  // Show the spinner while setting up the game
  $("#spinner").removeClass("disabled");

  // Reset the DOM
  $("#categories").empty();
  $("#clues").empty();
  $("#play").text("Restart");
  $("#active-clue").empty();
  categories = [];

  // Fetch game data
  const categoryIds = await getCategoryIds();
  for (let id of categoryIds) {
    const category = await getCategoryData(id);
    categories.push(category);
  }

  // Fill the table
  fillTable(categories);

  // Hide the spinner
  $("#spinner").addClass("disabled");
}
// gets the category id from the api
async function getCategoryIds() {
  const response = await fetch(`${API_URL}/categories`);
  const data = await response.json();

  const validCategories = data.filter(
    (cat) => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY
  );

  const selectedCategories = validCategories
    .sort(() => 0.5 - Math.random())
    .slice(0, NUMBER_OF_CATEGORIES);

  return selectedCategories.map((cat) => cat.id);
}

async function getCategoryData(categoryId) {
  const response = await fetch(`${API_URL}/category?id=${categoryId}`);
  const data = await response.json();

  const clues = data.clues
    .filter((clue) => clue.question && clue.answer)
    .slice(0, NUMBER_OF_CLUES_PER_CATEGORY)
    .map((clue, index) => ({
      id: clue.id,
      value: clue.value || (index + 1) * 200,
      question: clue.question,
      answer: clue.answer,
    }));

  return {
    id: data.id,
    title: data.title,
    clues,
  };
}

function fillTable(categories) {
  const $thead = $("#categories");
  const $tbody = $("#clues");

  $thead.empty();
  $tbody.empty();

  const $headerRow = $("<tr></tr>");
  categories.forEach((category) => {
    $headerRow.append(`<th>${category.title}</th>`);
  });
  $thead.append($headerRow);

  // Determine the maximum number of clues per category
  const maxClues = Math.max(
    ...categories.map((category) => category.clues.length)
  );

  // Populate the table body
  for (let i = 0; i < maxClues; i++) {
    const $row = $("<tr></tr>");
    categories.forEach((category) => {
      const clue = category.clues[i];
      if (clue) {
        $row.append(
          `<td class='clue' id='${category.id}-${clue.id}'>$${clue.value}</td>`
        );
      } else {
        // If there is no clue for this row, add an empty cell
        $row.append("<td></td>");
      }
    });
    $tbody.append($row);
  }
}

$(document).on("click", ".clue", handleClickOfClue);
function handleClickOfClue(event) {
  // If the clue has been clicked then nothing happens
  const clueElement = $(event.target);
  if (clueElement.hasClass("viewed")) {
    return;
  }
  const [categoryId, clueId] = event.target.id.split("-").map(Number);
  const category = categories.find((cat) => cat.id === categoryId);
  const clue = category.clues.find((c) => c.id === clueId);
  // One a clue is clicked its set to 1
  activeClue = clue;
  activeClueMode = 1;
  // Removes the clue from the board by setting the class to viewed
  $(event.target).addClass("viewed").text("");
  $("#active-clue").html(clue.question);
  category.clues = category.clues.filter((c) => c.id !== clueId);
  if (category.clues.length === 0) {
    categories = categories.filter((cat) => cat.id !== categoryId);
  }
}

$("#active-clue").on("click", handleClickOfActiveClue);
function handleClickOfActiveClue() {
  // One click set it to 1 and moves to active
  if (activeClueMode === 1) {
    activeClueMode = 2;
    // Second click reveals the answer
    $("#active-clue").html(activeClue.answer);
  } else if (activeClueMode === 2) {
    // Third click sets it back to zero
    activeClueMode = 0;
    $("#active-clue").empty();
    // After all clues are gone, the game ends
    if (categories.length === 0) {
      isPlayButtonClickable = true;
      $("#play").text("Restart the Game!");
      $("#active-clue").html("The End!");
    }
  }
}
