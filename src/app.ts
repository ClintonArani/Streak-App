document.addEventListener("DOMContentLoaded", () => {
    const showFormButton = document.getElementById("show-form-button") as HTMLButtonElement;
    const habitFormContainer = document.getElementById("habit-form-container") as HTMLDivElement;
    const habitForm = document.getElementById("habit-form") as HTMLFormElement;
    const activitiesContainer = document.querySelector(".activities") as HTMLDivElement;

    // Function to toggle display of habit form
    function toggleFormDisplay() {
        if (habitFormContainer.style.display === "none") {
            habitFormContainer.style.display = "block";
        } else {
            habitFormContainer.style.display = "none";
        }
    }

    // Event listener for the show form button
    showFormButton.addEventListener("click", () => {
        toggleFormDisplay();
    });

    interface Habit {
        id: number;
        habit: string;
        startDate: string;
        trackingPeriod: number;
        icon: string | null;
    }

    let habitIdCounter = 0;

    // Fetch habits from the JSON db
    async function fetchHabits() {
        try {
            const response = await fetch('http://localhost:3000/habits');
            const habits = await response.json();
            habits.forEach((habit: Habit) => {
                createHabitCard(habit);
                habitIdCounter = Math.max(habitIdCounter, habit.id + 1);
            });
        } catch (error) {
            console.error('Error fetching habits:', error);
        }
    }

    // Save habits to the JSON db
    async function saveHabit(habit: Habit) {
        try {
            await fetch('http://localhost:3000/habits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(habit)
            });
            createHabitCard(habit);
        } catch (error) {
            console.error('Error saving habit:', error);
        }
    }

    // Delete habit from the JSON db
    async function deleteHabit(habitId: number) {
        try {
            await fetch(`http://localhost:3000/habits/${habitId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    }

    // Create a new habit card
    function createHabitCard(habit: Habit) {
        const habitCard = document.createElement("div");
        habitCard.className = "habit-card";
        habitCard.dataset.habitId = habit.id.toString();

        const startDate = new Date(habit.startDate);
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        habitCard.innerHTML = `
            <div class="card-content">
                ${habit.icon ? `<img src="${habit.icon}" alt="${habit.habit}" class="habit-icon">` : ''}
                <p>${startDate.toDateString()}</p>
                <h5>${habit.habit}</h5>
                <p>Tracking Period: ${habit.trackingPeriod} days</p>
                <p>Count: <span class="days-since-start">${daysSinceStart}</span> days</p>
                <button class="delete-button">Delete</button>
            </div>
        `;

        // Add delete functionality to the delete button
        habitCard.querySelector(".delete-button")!.addEventListener("click", () => {
            activitiesContainer.removeChild(habitCard);
            deleteHabit(habit.id);
            
        });


        // Add the habit card to the activities container
        activitiesContainer.appendChild(habitCard);
    }

    // Handle form submission
    habitForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(habitForm);

        // Retrieve form data
        const habit = formData.get("habit") as string;
        const startDateStr = formData.get("startDate") as string;
        const trackingPeriod = parseInt(formData.get("trackingPeriod") as string);
        const iconFile = formData.get("icon") as File;

        // Check if required fields are empty
        if (!habit || !startDateStr || !trackingPeriod) {
            alert("Please fill out all required fields.");
            return;
        }

        // Parse the start date
        const startDate = new Date(startDateStr);
        const today = new Date();

        // Validate the start date
        if (startDate > today || startDate < new Date(today.setDate(today.getDate() - 1))) {
            alert("Start date must be today or in the past, but not in the future.");
            return;
        }

        // Read the image file if present
        let iconBase64: string | null = null;
        if (iconFile) {
            const reader = new FileReader();
            reader.onload = function (e) {
                iconBase64 = e.target?.result as string;
                const newHabit: Habit = {
                    id: habitIdCounter++,
                    habit,
                    startDate: startDateStr,
                    trackingPeriod,
                    icon: iconBase64
                };
                saveHabit(newHabit);

                // Display success message
                alert("You successfully started tracking this habit, buddy!");

                // Hide the form and reset it
                habitFormContainer.style.display = "none";
                habitForm.reset();
            };
            reader.readAsDataURL(iconFile);
        } else {
            const newHabit: Habit = {
                id: habitIdCounter++,
                habit,
                startDate: startDateStr,
                trackingPeriod,
                icon: null
            };
            saveHabit(newHabit);

            // Display success message
            alert("You successfully started tracking this habit, buddy!");

            // Hide the form and reset it
            habitFormContainer.style.display = "none";
            habitForm.reset();
        }
        
    });

    // Fetch existing habits on load
    fetchHabits();
    
});
