(() => {
  const quizzes = [...document.querySelectorAll("[data-quiz]")];
  const summary = document.querySelector("[data-quiz-summary]");
  const reset = document.querySelector("[data-quiz-reset]");

  function updateSummary() {
    if (!summary) return;
    const answered = quizzes.filter((quiz) => quiz.dataset.answered === "true");
    const correct = quizzes.filter((quiz) => quiz.dataset.result === "correct");

    if (answered.length < quizzes.length) {
      summary.textContent = `已完成 ${answered.length}/${quizzes.length}；先作答，再读取反馈。`;
      return;
    }

    if (correct.length === quizzes.length) {
      summary.textContent = `${correct.length}/${quizzes.length} 全部正确。下一步：合上页面，用一句话解释三类机制。`;
      return;
    }

    summary.textContent = `${correct.length}/${quizzes.length} 正确。重新判断层级，再完成一次无提示检索。`;
  }

  quizzes.forEach((quiz) => {
    const correctAnswer = quiz.dataset.correct;
    const feedback = quiz.querySelector("[data-feedback]");
    const buttons = [...quiz.querySelectorAll("button[data-answer]")];
    const optionLengths = new Set(
      buttons.map((button) => [...button.textContent.replace(/\s+/gu, "")].length),
    );

    if (optionLengths.size !== 1) {
      console.error("Quiz options must have equal Unicode lengths.", quiz);
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        buttons.forEach((candidate) => {
          candidate.classList.remove("correct", "incorrect");
          candidate.setAttribute("aria-pressed", "false");
        });

        const isCorrect = button.dataset.answer === correctAnswer;
        button.classList.add(isCorrect ? "correct" : "incorrect");
        button.setAttribute("aria-pressed", "true");
        quiz.dataset.answered = "true";
        quiz.dataset.result = isCorrect ? "correct" : "incorrect";

        if (feedback) {
          feedback.textContent = isCorrect
            ? `正确。${quiz.dataset.correctFeedback}`
            : `再判断一次。${quiz.dataset.incorrectFeedback}`;
        }

        updateSummary();
      });
    });
  });

  reset?.addEventListener("click", () => {
    quizzes.forEach((quiz) => {
      delete quiz.dataset.answered;
      delete quiz.dataset.result;
      quiz.querySelectorAll("button[data-answer]").forEach((button) => {
        button.classList.remove("correct", "incorrect");
        button.setAttribute("aria-pressed", "false");
      });
      const feedback = quiz.querySelector("[data-feedback]");
      if (feedback) feedback.textContent = "尚未作答。";
    });
    updateSummary();
  });

  updateSummary();
})();
