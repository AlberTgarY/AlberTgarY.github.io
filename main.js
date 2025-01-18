document.addEventListener('DOMContentLoaded', function () {
    // Smooth scroll for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            document.querySelectorAll('main > section').forEach(section => {
                section.style.display = section.id === target || target === "about" && section.id === "about" ? "block" : "none";
            });
        });
    });

    // Show the "About" section by default
    document.querySelector('#about').style.display = 'block';
});
