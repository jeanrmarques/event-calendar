<template>
  <section>
    <article id="calendar">
      <h4 class="monthHeader">
        <button @click="changeMonth('back')">
          <i class="fas fa-arrow-left"></i> <span>Previous Month</span>
        </button>
        <span
          ><i class="far fa-calendar-alt"></i>
          {{ currentMonthData.name + " / " + currentMonthData.year }}</span
        >
        <button @click="changeMonth('fwd')">
          <span>Next Month</span> <i class="fas fa-arrow-right"></i>
        </button>
      </h4>
      <div class="daysHeader">
        <div :key="index" v-for="(day, index) in weekdays">{{ day }}</div>
      </div>
      <div class="grid-days">
        <div
          @click.stop="reminder.date = day.fullDate"
          :class="[
            day.isCurrentMonth ? '' : 'disabled',
            day.isWeekend ? 'isWeekend' : '',
            'dayItem',
          ]"
          :key="index"
          v-for="(day, index) in currentMonthData.data"
        >
          <span class="bgDay">{{ day.dayNumber }}</span>
          <span
            :class="[
              isToday(day.dayNumber) ? 'isToday' : '',
              day.isCurrentMonth ? 'currentMonth' : '',
              'dayNumber',
            ]"
          >
            {{ day.dayNumber }}
          </span>

          <span
            title="Remove all reminders from this date."
            class="removeDayReminders"
            @click.stop="removeDayReminders(day.fullDate)"
            v-if="getReminders(day.fullDate).length > 0"
            ><i class="fas fa-times"></i
          ></span>
          <ul class="reminders">
            <li
              @click.stop="selectedReminder(reminder, index)"
              :title="[reminder.time, reminder.city, reminder.title]"
              :style="{ 'border-color': reminder.color }"
              :key="reminder.id"
              v-for="(reminder, index) in sortReminders(
                getReminders(day.fullDate)
              )"
            >
              <span class="time">{{ reminder.time }}</span> -
              <span class="name">{{ reminder.title }}</span>
              <div class="extraInfo">
                <span class="city">{{ reminder.city }}</span>
                <span class="weather">({{ reminder.weather }})</span>
              </div>
              <i class="fas fa-edit"></i>
              <i
                title="Remove this reminder"
                @click.stop.prevent="removeReminder(reminder)"
                class="fas fa-times"
              ></i>
            </li>
          </ul>
        </div>
      </div>
    </article>
    <article id="form">
      <div class="appInfo">
        <img src="./assets/logo.png" alt="VueJS" />
        <h2>Calendar App</h2>
        <h5>Made with VueJS</h5>
        <hr />
      </div>
      <h4 v-if="!reminder.id">
        <i class="far fa-calendar-plus"></i> Add a reminder
      </h4>
      <h4 v-else><i class="fas fa-edit"></i> Edit Reminder</h4>
      <form @submit="reminderSubmit">
        <input type="hidden" v-model="reminder.id" />
        <fieldset>
          <label for="reminderTitle"
            ><i class="fas fa-heading"></i> Title</label
          >
          <input
            v-model="reminder.title"
            type="text"
            id="reminderTitle"
            name="reminderTitle"
            :maxlength="[form.titleMaxLength]"
            placeholder="How will you call your reminder?"
            required
          />
        </fieldset>
        <fieldset>
          <label for="reminderTitle"
            ><i class="far fa-calendar"></i> Date</label
          >
          <input
            v-model="reminder.date"
            type="date"
            id="reminderDate"
            name="reminderDate"
            :max="[form.maxDate]"
            :min="[form.minDate]"
            required
          />
        </fieldset>
        <fieldset>
          <label for="reminderTitle"><i class="far fa-clock"></i> Time</label>
          <input
            v-model="reminder.time"
            type="time"
            id="reminderTime"
            name="reminderTime"
            required
          />
        </fieldset>
        <fieldset>
          <label for="reminderTitle"
            ><i class="fas fa-palette"></i> Color</label
          >
          <input
            v-model="reminder.color"
            type="color"
            id="reminderColor"
            name="reminderColor"
          />
        </fieldset>
        <fieldset>
          <label for="reminderTitle"><i class="fas fa-city"></i> City</label>
          <input
            v-model="reminder.city"
            type="text"
            id="reminderCity"
            name="reminderCity"
            placeholder="Please type the name of the city"
            required
          />
        </fieldset>
        <input
          type="submit"
          :value="[reminder.id ? 'Save Reminder' : 'Add Reminder']"
          class="btn btn-block"
        />
        <button @click="resetForm()" v-if="reminder.id" class="btn btn-block">
          Cancel
        </button>
      </form>
    </article>
  </section>
</template>

<script>
import moment from "moment";

export default {
  name: "App",
  props: {
    weekdays: {
      type: Array,
      default: function () {
        return [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
      },
    },
  },
  data() {
    return {
      selectedDate: moment(),
      api_key: "bda5283718881e6ba9344df3baf37384",
      weather_api: "http://api.openweathermap.org/data/2.5/",
      weather_res: {},
      calendar: [],
      reminders: [],
      form: {
        minDate: moment().startOf("month").format("YYYY-MM-DD"),
        maxDate: moment().endOf("month").format("YYYY-MM-DD"),
        titleMaxLength: 30,
      },
      reminder: {
        id: null,
        title: "",
        date: moment().format("YYYY-MM-DD"),
        time: moment().format("HH:MM"),
        color: "#1f1f72",
        city: "",
        weather: "",
      },
    };
  },
  methods: {
    // [Mandatory Feature]
    // Populates the grid with the days of the month, giving certain properties to each day so we can track it better (isCurrentMonth, isWeekend, etc.)
    updateCalendar() {
      let monthArray = [];
      let endOfMonth = parseInt(
        this.selectedDate.clone().endOf("month").format("DD")
      );
      let startOfMonthWeekDay = parseInt(
        this.selectedDate.clone().startOf("month").day()
      );

      let days = Math.ceil((endOfMonth + startOfMonthWeekDay) / 7) * 7;
      let newMonth = true;

      if (newMonth) {
        for (let i = 1; i <= days; i++) {
          let currentDay = {};
          let dayNumber;
          let val = i - startOfMonthWeekDay;
          let month = this.selectedDate.format("MMMM");
          let isCurrentMonth = true;
          let isWeekend = false;
          let monthNumber = parseInt(this.selectedDate.format("MM"));
          let yearNumber = parseInt(this.selectedDate.format("YYYY"));
          let lastDayOfPrevMonth = parseInt(
            this.selectedDate
              .clone()
              .subtract(1, "months")
              .endOf("month")
              .format("DD")
          );
          let endOfMonth = parseInt(
            this.selectedDate.clone().endOf("month").format("DD")
          );
          let fullDate;

          if (val > 0 && val <= endOfMonth) {
            dayNumber = val;
          } else if (val > endOfMonth) {
            dayNumber = val - endOfMonth;
            if (monthNumber == 12) {
              monthNumber = 1;
              yearNumber++;
            } else {
              monthNumber++;
            }
          } else {
            dayNumber = lastDayOfPrevMonth + val;
            if (monthNumber == 1) {
              monthNumber = 12;
              yearNumber--;
            } else {
              monthNumber--;
            }
          }

          let jsD = new Date(yearNumber + "-" + monthNumber + "-" + dayNumber);

          fullDate = moment(jsD).format("YYYY-MM-DD");

          if (i % 7 == 1 || i % 7 == 0) {
            isWeekend = true;
          }

          if (i - startOfMonthWeekDay <= 0) {
            month = this.selectedDate
              .clone()
              .subtract(1, "months")
              .format("MMMM");
            isCurrentMonth = false;
          }

          if (i - startOfMonthWeekDay > endOfMonth) {
            month = this.selectedDate.clone().add(1, "months").format("MMMM");
            isCurrentMonth = false;
          }

          currentDay = {
            month: month,
            fullDate: fullDate,
            dayNumber: dayNumber,
            isCurrentMonth: isCurrentMonth,
            isWeekend: isWeekend,
          };
          monthArray.push(currentDay);
        }
        let monthToSave = {
          month: this.selectedDate.format("YYYY-MM-"),
          data: monthArray,
        };

        this.calendar = monthToSave;
      }
    },

    //[Optional Feature]
    // Changes the current month on the data object, and refreshes the calendar (It also changes the range of accepted dates on the form input)
    changeMonth(arg) {
      // expects arg to be 'fwd' or 'back'
      if (arg === "fwd") {
        this.selectedDate.add(1, "months");
      } else if (arg === "back") {
        this.selectedDate.subtract(1, "months");
      }
      this.form = {
        maxDate: this.selectedDate.endOf("month").format("YYYY-MM-DD"),
        minDate: this.selectedDate.startOf("month").format("YYYY-MM-DD"),
      };
      this.updateCalendar();
    },

    // [Extra Feature]
    // Utility function to check if its today while doing the loop (So we can mark it)
    isToday(day) {
      let today = moment().format("YYYYMMMMDD");
      if (this.selectedDate.format("YYYYMMMM") + day == today) {
        return true;
      } else {
        return false;
      }
    },

    // [Mandatory Feature]
    // Clicking on a reminder will automatically start its editing, as it will autofill the form with the reminder data (and can be seen being changed live)
    selectedReminder(reminder) {
      this.reminder = reminder;
    },

    // Utility function that will parse the data before actually saving the reminder. (the weather fetch is also done here)
    async reminderSubmit(e) {
      e.preventDefault();
      let weatherRes;

      await fetch(
        this.weather_api +
          "weather?q=" +
          this.reminder.city +
          "&units=metric&APPID=" +
          this.api_key
      )
        .then((response) => response.json())
        .then((data) => (weatherRes = data));

      const newReminder = {
        id: this.reminder.id,
        title: this.reminder.title,
        date: this.reminder.date,
        time: this.reminder.time,
        color: this.reminder.color,
        city: this.reminder.city,
        weather: weatherRes.weather[0].main || "Weather not available",
      };

      this.addReminder(newReminder);
    },

    //[Mandatory Feature]
    // Adds a reminder on a selected day.
    // A reminder has {Id, Title, Date, Time, Color, City, Weather}
    //
    //* Id - Just a random generated number to keep reminders unique;
    //* Title - Has a limit of 30 characters;
    //* Date - Has to be in the selected month (no restriction for a day before today, even tho would make sense in a reminder calendar, could easily be implemented)
    //* Time - Just a regular time input;
    //* Color - User selected color from a color input;
    //* City - City name typed by user (That will fetch the CURRENT weather on that location, even tho the requirement was to fetch the weather for the selected day, unfortunately I wasnt able to do so through the api I tried)
    //* Weather - As cited above, it stores the weather information (simple), fetched through an api (it has a default text value in case the call fails or returns empty)
    addReminder(reminder) {
      if (!reminder.id) {
        reminder.id = Math.floor(Math.random() * 100000);
      }
      this.reminders = [...this.reminders, reminder];
      this.resetForm();
    },

    resetForm() {
      this.reminder = {
        id: null,
        title: "",
        date: "",
        time: "",
        color: "#1f1f72",
        city: "",
        weather: "",
      };
    },

    //[Mandatory Feature]
    // Sorts the reminders when listing them on a given day.
    sortReminders: function (ar) {
      function compare(a, b) {
        if (a.time < b.time) return -1;
        if (a.time > b.time) return 1;
        return 0;
      }

      return ar.sort(compare);
    },

    //[Mandatory Feature]
    // Remove a selected reminder.
    removeReminder(reminder) {
      let index = this.reminders.findIndex((r) => r.id === reminder.id);
      this.reminders.splice(index, 1);
    },

    //[Optional Feature]
    // Removes all the reminders of the day sent as parameter.
    removeDayReminders(day) {
      let updated = this.reminders.filter(
        (r) => r.date != moment(day).format("YYYY-MM-DD")
      );
      console.log(updated);
      this.reminders = updated;
    },
    getReminders: function (date) {
      let res = this.reminders.filter(
        (r) => r.date === moment(date).format("YYYY-MM-DD")
      );
      return res;
    },
  },
  computed: {
    currentMonthData: function () {
      let name = this.selectedDate.format("MMMM");
      let year = this.selectedDate.format("YYYY");
      return {
        name: name,
        year: year,
        data: this.calendar.data,
      };
    },
  },
  created: function () {
    this.updateCalendar();
  },
};
</script>

<style lang="scss">
html {
  box-sizing: border-box;
}
*,
*:before,
*:after {
  box-sizing: inherit;
}

// Vue color theme
:root {
  --main-color: #35495e;
  --secondary-color: #41b883;
  --fade-color: #00000038;
  --light-color: #ffffff;
}

#app {
  font-family: "Montserrat", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;

  > section {
    display: flex;
    flex-direction: row;
  }
}

#calendar {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 85vh;
  width: 80%;

  .monthHeader {
    display: flex;
    justify-content: space-between;
    margin: 0.2vw 0 0.2vw;
    font-size: 1vw;
    font-family: sans-serif;
    text-transform: uppercase;

    button {
      background: var(--main-color);
      border: none;
      border-radius: 0.2vw;
      color: var(--light-color);
      padding: 0.2vw 0.5vw;
      transition: all 0.2s linear;
      cursor: pointer;
      margin: 0 0.2vw;

      span {
        font-size: 0.8em;
        position: relative;
        top: -0.05vw;
        display: inline-block;
        margin: 0 0.2vw;
      }

      &:hover {
        background: #080843;
      }
    }
  }

  .daysHeader {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--main-color);
    // border-top-left-radius: 0.5vw;
    // border-top-right-radius: 0.5vw;
    border-radius: 0.5vw 0.5vw 0 0;
    color: var(--light-color);
    padding: 0.5vw 0.2vw;
    font-size: 0.8vw;
    text-align: center;
    font-family: sans-serif;
  }

  .grid-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    max-height: 91vh;
    text-align: left;
    border: 1px solid var(--main-color);
    -webkit-touch-callout: none;
    user-select: none;
    border-bottom-left-radius: 0.5vw;
    border-bottom-right-radius: 0.5vw;
    overflow: hidden;
    box-shadow: 0px 8px 20px 0px rgba(0, 0, 0, 0.75);

    .dayItem {
      border: 1px solid var(--main-color);
      position: relative;
      transition: all 0.2s linear;
      cursor: pointer;
      height: 15vh;
      overflow: hidden;

      &.disabled {
        pointer-events: none;
      }

      // just a little extra to make the calendar look fancier
      .bgDay {
        display: block;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 12vw;
        opacity: 0.04;
        pointer-events: none;
      }

      .removeDayReminders {
        position: absolute;
        display: block;
        width: 1vw;
        height: 1vw;
        font-size: 0.8vw;
        line-height: 0.8vw;
        text-align: center;
        cursor: pointer;
        z-index: 5;
        top: 0;
        right: 0;
        color: #fff;
        background: var(--main-color);
        border-bottom-left-radius: 2vw;
        transition: all 0.2s linear;

        i {
          display: block;
          font-size: 0.9em;
          position: relative;
          top: 0px;
          right: -2px;
        }

        &:hover {
          background: #000;
        }
      }

      .reminders {
        font-size: 0.7vw;
        margin: 0;
        padding: 1.7em 0.3em 0 0.3em;
        list-style: none;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;

        li {
          padding: 0.3em 0.3em 0.3em 0.5em;
          border-radius: 0 0.8vw 0 0.8vw;
          color: #333;
          border: 2px solid;
          border-left: 4px solid;
          display: block;
          margin-bottom: 0.5em;
          background: #fff;
          -webkit-touch-callout: none;
          user-select: none;
          position: relative;
          overflow: hidden;

          .fa-edit {
            position: absolute;
            transition: all 0.2s linear;
            top: 50%;
            right: 0;
            opacity: 0;
            transform: translateY(-50%) translateX(200%);
          }

          .fa-times {
            position: absolute;
            transition: all 0.2s linear;
            top: 50%;
            right: 0;
            opacity: 0;
            transform: translateY(-50%) translateX(200%);
          }

          &:hover {
            .fa-edit {
              transform: translateY(25%) translateX(-32%);
              opacity: 1;
            }

            .fa-times {
              transform: translateY(-115%) translateX(-93%);
              opacity: 1;
            }
          }
        }
      }

      &.isWeekend {
        background: #e5e5e5;

        .dayNumber {
          &.currentMonth {
            color: var(--secondary-color) !important;
          }
        }
      }

      &.selected {
        background: #5eb4e1 !important;
      }

      &:hover {
        background: var(--fade-color);
      }

      .dayNumber {
        color: #333;
        opacity: 0.5;
        font-size: 0.8vw;
        font-weight: bold;
        position: absolute;
        top: 0.1vw;
        left: 0.1vw;

        &.isToday {
          border: 2px solid #cc0000;
          border-radius: 50%;
          transform: translate(-1px, -1px);
        }

        &.currentMonth {
          opacity: 1;
        }
      }
    }
  }
}

#form {
  display: flex;
  flex-direction: column;
  width: 20%;
  padding: 0 1vw;
  box-sizing: border-box;

  .appInfo {
    h2 {
      margin-top: 0.4vw;
    }
  }

  fieldset {
    padding: 0;
  }

  .appInfo {
    img {
      max-width: 50%;
      margin: 0 auto;
    }
  }

  form {
    border: none;
    margin: 0;
    padding: 1vw 2vw 2vw;
    background: var(--secondary-color);
    border-radius: 0.5vw;
    border: 2px solid var(--main-color);

    input {
      padding: 0.2vw;
      border: none;
      border-radius: 5px;
    }

    button,
    input[type="submit"] {
      background: var(--main-color);
      border: none;
      border-radius: 0.2vw;
      color: var(--light-color);
      padding: 0.4vw 0.7vw;
      transition: all 0.2s linear;
      cursor: pointer;
      margin: 0 0.2vw;
      font-size: 1vw;
    }

    input[type="color"] {
      padding: 0 !important;
      border-radius: 5px;
    }

    fieldset {
      border: none;
      margin-bottom: 1vw;

      label,
      input {
        display: block;
        text-align: left;
        width: 100%;
        font-size: 0.8vw;
      }

      label {
        margin-bottom: 0.3em;
      }
    }
  }
}
</style>
