$(async function() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navSubmit = $("#nav-submit")
  const $navFavorite = $("#nav-favorite")
  const $allFavoritesList = $("#favorited-articles")
  const $article = $("article")
  const $navHome = $("#nav-all")

  let storyList = null;
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */
  $loginForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });



    /**
   * Event listener for SUBMITTING A NEW ARTICLE.
   *  If successful we will append new article to DOM
   */
  $submitForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page-refresh on submit
    // const token = localStorage.getItem("token");
  
    const author = $("#author").val();
    const title = $("#title").val();
    const url = $("#url").val();

    let newStory = {
      author,
      title, 
      url
    };

    // call the login static method to create a new story
    await storyList.addStory(currentUser, newStory);
    $navHome.trigger("click")

  });

// Event Listener for clicking on trashcan
$article.on("click", ".fa-trash", async function(e){
  let $story = $(this).closest("li")
  let storyId = $story.attr("id")
  await storyList.removeStory(storyId, currentUser)
  $story.remove()
})


  /**
   * Event listener for FAVORITING articles.
   *  
   */
 
  $article.on('click', ".fa-star", function(e){

    $(this).toggleClass("far fas") //blank
    // $(this).toggleClass("fas fa-star") //filled

    let storyId = $(this).closest("li").attr("id")
    const token = localStorage.getItem("token");
    let username = localStorage.getItem("username")

    if ($(this).hasClass("far")) {
      currentUser.deleteFavorite(storyId, username, token)

    } else {
      currentUser.addFavorite(storyId, username, token)
      // let story = generateStoryHTML(response)
      // $allFavoritesList.append(story)
    }
  });



  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */
  $createAccountForm.on("submit", async function(evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */
  $navLogOut.on("click", function() {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */
  $navLogin.on("click", function() {
    hideElements()
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    // $allStoriesList.toggle();
  });



    /**
   * Event Handler for Clicking Submit Button to Show the Login and Create Account Forms
   */
  $navSubmit.on("click", function() {
    hideElements()
    $submitForm.slideToggle();
  });



    /**
   * Event Handler for Clicking Favorites Button to favorites section
   */
  $navFavorite.on("click", function() {
    hideElements()
    generateFavorites()
    $allFavoritesList.slideToggle();
  });



  /**
   * Event handler for Navigation to Homepage
   */
  $("body").on("click", "#nav-all", async function() {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */
  async function checkIfLoggedIn() {
  
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
      await generateFavorites();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */
  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    // $allStoriesList.show();
    $navHome.trigger("click")
    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }


  async function generateFavorites() {
    let userFavorites = currentUser.favorites
    $allFavoritesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of userFavorites) {
      const result = generateStoryHTML(story);
      $allFavoritesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    let star = "hidden"
    let trashcan = "hidden"


    if (currentUser) {
      let favorites = currentUser.favorites
      let userStories = currentUser.ownStories
      star = "far fa-star"

      //checks if story from storyList is a favorite in user favorites
        for(let favorite of favorites){
          if(favorite.storyId === story.storyId){
              star = "fas fa-star"
              break;
          }
        }

        //checks if story from storyList is a story created by the user
        for(let userStory of userStories){
          if(userStory.storyId === story.storyId){
            trashcan = "fa fa-trash"
          }
        }
    }
 

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <i class="${star}"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <i class="${trashcan}"></i>
        <br>
        <small class="article-author">by ${story.author}</small>
        <small class="article-username">| posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  // hide all elements in elementsArr
  function hideElements() {
    const elementsArr = [
      $allFavoritesList,
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navSubmit.show();
    $navFavorite.show();
  }

  // simple function to pull the hostname from a URL
  function getHostName(url) {
    let hostName;

    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  // sync current user information to localStorage
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
