// App State
const app = {
    currentScreen: 'home',
    selectedCategory: 'any',
    difficulty: null,
    questions: [],
    currentQuestionIndex: 0,
    score: 0,
    timer: 0,
    timerInterval: null,
    selectedAnswer: null,
    isAnswered: false,
    startTime: null
};

// Categories mapping
const categories = {
    'any': 'Any Category',
    '9': 'General Knowledge',
    '10': 'Entertainment: Books',
    '11': 'Entertainment: Film',
    '12': 'Entertainment: Music',
    '13': 'Entertainment: Musicals & Theatres',
    '14': 'Entertainment: Television',
    '15': 'Entertainment: Video Games',
    '16': 'Entertainment: Board Games',
    '17': 'Science & Nature',
    '18': 'Science: Computers',
    '19': 'Science: Mathematics',
    '20': 'Mythology',
    '21': 'Sports',
    '22': 'Geography',
    '23': 'History',
    '24': 'Politics',
    '25': 'Art',
    '26': 'Celebrities',
    '27': 'Animals',
    '28': 'Vehicles',
    '29': 'Entertainment: Comics',
    '30': 'Science: Gadgets',
    '31': 'Entertainment: Japanese Anime & Manga',
    '32': 'Entertainment: Cartoon & Animations'
};

// DOM Elements
const screens = {
    home: document.getElementById('home-screen'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
};

const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    questionCounter: document.getElementById('question-counter'),
    timer: document.getElementById('timer'),
    scoreDisplay: document.getElementById('score-display'),
    progress: document.getElementById('progress'),
    questionCategory: document.getElementById('question-category'),
    questionText: document.getElementById('question-text'),
    answersContainer: document.getElementById('answers-container'),
    nextBtn: document.getElementById('next-btn'),
    quitBtn: document.getElementById('quit-btn'),
    tryAgainBtn: document.getElementById('try-again-btn'),
    newQuizBtn: document.getElementById('new-quiz-btn'),
    homeBtn: document.getElementById('home-btn'),
    scoreText: document.querySelector('.score-text'),
    scoreCircle: document.querySelector('.score-circle'),
    resultMessage: document.getElementById('result-message'),
    resultDescription: document.getElementById('result-description'),
    correctAnswers: document.getElementById('correct-answers'),
    timeTaken: document.getElementById('time-taken'),
    accuracy: document.getElementById('accuracy'),
    toast: document.getElementById('toast'),
    categoryGrid: document.getElementById('category-grid')
};

// Event Listeners
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        app.selectedCategory = btn.dataset.category;
        showToast(`Category: ${categories[app.selectedCategory]} selected`);
    });
});

document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        app.difficulty = btn.dataset.difficulty;
        startQuiz();
    });
});

elements.nextBtn.addEventListener('click', nextQuestion);
elements.quitBtn.addEventListener('click', showHomeScreen);
elements.tryAgainBtn.addEventListener('click', () => startQuiz());
elements.newQuizBtn.addEventListener('click', () => {
    app.selectedCategory = 'any';
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
    showHomeScreen();
});
elements.homeBtn.addEventListener('click', showHomeScreen);

// Functions
function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
    });
    screens[screenName].classList.add('active');
    app.currentScreen = screenName;
}

function showToast(message, duration = 3000) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, duration);
}

function showLoading(show = true) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

async function fetchQuestions(category, difficulty) {
    let categoryParam = category === 'any' ? '' : `&category=${category}`;
    let difficultyParam = difficulty === 'random' ? '' : `&difficulty=${difficulty}`;
    
    // Exclude entertainment categories if "any" is selected
    if (category === 'any') {
        const excludeCategories = [10, 11, 12, 13, 14, 15, 16, 26, 29, 31, 32];
        const allCategories = Object.keys(categories).map(Number).filter(n => !isNaN(n));
        const validCategories = allCategories.filter(cat => !excludeCategories.includes(cat));
        const randomCategory = validCategories[Math.floor(Math.random() * validCategories.length)];
        categoryParam = `&category=${randomCategory}`;
    }
    
    const apiUrl = `https://opentdb.com/api.php?amount=10${categoryParam}${difficultyParam}&type=multiple`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.response_code === 0) {
            return data.results;
        } else {
            throw new Error('API returned no results');
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
        showToast('Failed to fetch questions. Retrying...');
        // Retry once
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.response_code === 0) {
                return data.results;
            }
        } catch (retryError) {
            showToast('Unable to fetch questions. Please try again later.');
        }
        return [];
    }
}

async function startQuiz() {
    showLoading(true);
    
    app.currentQuestionIndex = 0;
    app.score = 0;
    app.timer = 0;
    app.isAnswered = false;
    app.startTime = Date.now();
    
    app.questions = await fetchQuestions(app.selectedCategory, app.difficulty);
    
    showLoading(false);
    
    if (app.questions.length === 0) {
        showToast('No questions available. Please try different settings.');
        return;
    }
    
    showToast(`Starting ${app.difficulty} quiz with ${categories[app.selectedCategory]} questions!`);
    showScreen('quiz');
    startTimer();
    displayQuestion();
}

function startTimer() {
    if (app.timerInterval) clearInterval(app.timerInterval);
    
    app.timerInterval = setInterval(() => {
        app.timer++;
        const minutes = Math.floor(app.timer / 60);
        const seconds = app.timer % 60;
        elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (app.timerInterval) {
        clearInterval(app.timerInterval);
        app.timerInterval = null;
    }
}

function displayQuestion() {
    if (app.currentQuestionIndex >= app.questions.length) {
        showResults();
        return;
    }
    
    app.isAnswered = false;
    elements.nextBtn.disabled = true;
    
    const question = app.questions[app.currentQuestionIndex];
    
    // Update progress
    const progressPercent = ((app.currentQuestionIndex + 1) / app.questions.length) * 100;
    elements.progress.style.width = `${progressPercent}%`;
    elements.questionCounter.textContent = `Question ${app.currentQuestionIndex + 1} of ${app.questions.length}`;
    elements.scoreDisplay.textContent = `Score: ${app.score}`;
    
    // Display category
    const categoryName = categories[question.category] || 'Unknown';
    elements.questionCategory.textContent = categoryName;
    
    // Display question text
    elements.questionText.textContent = decodeHtml(question.question);
    
    // Prepare answers
    const answers = [...question.incorrect_answers, question.correct_answer];
    const shuffledAnswers = shuffleArray(answers);
    
    // Display answers
    elements.answersContainer.innerHTML = '';
    shuffledAnswers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.innerHTML = `<span style="margin-right: 10px; font-weight: bold;">${String.fromCharCode(65 + index)}.</span> ${decodeHtml(answer)}`;
        button.addEventListener('click', () => selectAnswer(answer, question.correct_answer));
        elements.answersContainer.appendChild(button);
    });
}

function selectAnswer(selected, correct) {
    if (app.isAnswered) return;
    
    app.isAnswered = true;
    
    const buttons = elements.answersContainer.querySelectorAll('.answer-btn');
    
    buttons.forEach(button => {
        button.disabled = true;
        
        const buttonText = button.textContent.replace(/^[A-Z]\.\s*/, '');
        
        if (decodeHtml(buttonText) === decodeHtml(correct)) {
            button.classList.add('correct');
        } else if (decodeHtml(buttonText) === decodeHtml(selected)) {
            button.classList.add('incorrect');
        }
    });
    
    if (decodeHtml(selected) === decodeHtml(correct)) {
        app.score++;
        showToast('✓ Correct answer!');
    } else {
        showToast('✗ Incorrect answer.');
    }
    
    elements.scoreDisplay.textContent = `Score: ${app.score}`;
    elements.nextBtn.disabled = false;
}

function nextQuestion() {
    app.currentQuestionIndex++;
    displayQuestion();
}

function showResults() {
    stopTimer();
    
    const percentage = Math.round((app.score / app.questions.length) * 100);
    const passed = percentage >= 50;
    
    // Update score circle
    elements.scoreCircle.style.setProperty('--score-percent', `${percentage}%`);
    elements.scoreText.textContent = `${percentage}%`;
    
    // Update result message
    if (percentage >= 80) {
        elements.resultMessage.textContent = '🏆 Excellent! You\'re a Quiz Master!';
        elements.resultMessage.style.color = 'var(--success-color)';
    } else if (passed) {
        elements.resultMessage.textContent = '🎉 Congratulations! You Passed!';
        elements.resultMessage.style.color = 'var(--success-color)';
    } else {
        elements.resultMessage.textContent = '😔 You Failed. Better Luck Next Time!';
        elements.resultMessage.style.color = 'var(--danger-color)';
    }
    
    // Update result description
    elements.resultDescription.textContent = `You scored ${app.score} out of ${app.questions.length} questions correctly.`;
    
    // Update stats
    elements.correctAnswers.textContent = app.score;
    const minutes = Math.floor(app.timer / 60);
    const seconds = app.timer % 60;
    elements.timeTaken.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    elements.accuracy.textContent = `${percentage}%`;
    
    showScreen('results');
}

function showHomeScreen() {
    stopTimer();
    showScreen('home');
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

// Check API connection status
async function checkApiStatus() {
    try {
        const response = await fetch('https://opentdb.com/api.php?amount=1');
        if (response.ok) {
            document.querySelector('.api-status-dot').style.background = '#48bb78';
            document.querySelector('.api-status span:last-child').textContent = 'API Connected';
        } else {
            throw new Error('API not responding');
        }
    } catch (error) {
        document.querySelector('.api-status-dot').style.background = '#f56565';
        document.querySelector('.api-status span:last-child').textContent = 'API Disconnected';
    }
}

// Initialize the app
showScreen('home');
checkApiStatus();
setInterval(checkApiStatus, 30000); // Check API status every 30 seconds