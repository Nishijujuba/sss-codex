
document.addEventListener("click", (event) => {
  const chip = event.target.closest(".source-chip");
  if (!chip) return;
  chip.classList.add("visited-source");
});
