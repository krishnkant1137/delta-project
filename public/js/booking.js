document.addEventListener("DOMContentLoaded", async () => {
  const datePicker = document.getElementById("date-picker");
  const listingId = datePicker.dataset.listingId;

  try {
      const response = await fetch(`/bookings/check-availability/${listingId}`);
      const data = await response.json();

      if (data.bookedDates) {
          const disabledDates = data.bookedDates.map(date => new Date(date).toISOString().split('T')[0]);

          datePicker.addEventListener("input", (event) => {
              if (disabledDates.includes(event.target.value)) {
                  alert("This date is already booked. Please select another date.");
                  event.target.value = "";
              }
          });
      }
  } catch (error) {
      console.error("Error fetching availability:", error);
  }
});
