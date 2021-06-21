<template>
  <section>
    <article id="calendar">
      <h4 class="monthHeader">
        <button @click="decreaseMonth"><i class="fas fa-arrow-left"></i> <span>Previous Month</span></button> 
        {{ currentMonthData.name + ' ~ ' + currentMonthData.year }}
        <button @click="increaseMonth"><span>Next Month</span> <i class="fas fa-arrow-right"></i></button></h4>
      <div class="daysHeader">
        <div :key="index" v-for="(day, index) in weekdays">{{ day }}</div>
      </div>
      <div class="grid-days">
        <div @click.stop="clickDay(index, day)" :class="[day.isCurrentMonth ? '' : 'disabled', day.isWeekend ? 'isWeekend' : '', 'dayItem']" :key="index" v-for="(day, index) in currentMonthData.data">
          <span class="bgDay">{{ day.dayNumber }}</span>
          <span :class="[isToday(day.dayNumber) ? 'isToday' : '', day.isCurrentMonth ? 'currentMonth' : '', 'dayNumber']">
            {{ day.dayNumber }}
          </span>

          <span title="Remove all reminders from this date." class="clearSchedule" @click.stop="clearSchedule(day)" v-if="day.reminders.length > 0"><i>+</i></span>
          <ul class="reminders">
            <li @click.stop="reminderClick(reminder, index)" :title="[reminder.time, reminder.city, reminder.title]" :style="{'border-color': reminder.color}" :key="reminder.id" v-for="(reminder, index) in sortReminders(day.reminders)">
              <i class="fas fa-edit"></i>
              <span class="time">{{reminder.time}}</span> - <span class="name">{{reminder.title}}</span>
              <div class="extraInfo">
                <span class="city">{{reminder.city}}</span> <span class="weather">({{reminder.weather}})</span> <i title="Remove this reminder" @click.stop.prevent="removeReminder(reminder)" class="fas fa-times"></i>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </article>
    <article id="form">
      <h4 v-if="!reminder.id">Add a reminder</h4>
      <h4 v-else>Edit Reminder</h4>
      <form @submit="onSubmit" >
        <input type="hidden" v-model="reminder.id" />
        <fieldset>
          <label for="reminderTitle">Title</label>
          <input v-model="reminder.title" type="text" id="reminderTitle" name="reminderTitle" :maxlength="[form.titleMaxLength]" placeholder="How will you call your reminder?" required/>
        </fieldset>
        <fieldset>
          <label for="reminderTitle">Date</label>
          <input v-model="reminder.date" type="date" id="reminderDate" name="reminderDate" :max="[form.maxDate]" :min="[form.minDate]" required />
        </fieldset>
        <fieldset>
          <label for="reminderTitle">Time</label>
          <input v-model="reminder.time" type="time" id="reminderTime" name="reminderTime"  required />
        </fieldset>
        <fieldset>
          <label for="reminderTitle">Color</label>
          <input v-model="reminder.color" type="color" id="reminderColor" name="reminderColor" />
        </fieldset>
        <fieldset>
          <label for="reminderTitle">City</label>
          <input v-model="reminder.city" type="text" id="reminderCity" name="reminderCity" placeholder="Please type the name of the city" required />
        </fieldset>
        <input type="submit" :value="[reminder.id ? 'Save Reminder' : 'Add Reminder']" class="btn btn-block" />
      </form>
    </article>
  </section>
</template>

<script>
// import Calendar from './components/Calendar.vue'
import moment from "moment"

export default {
  name: 'App',
  components: {
    
  },
  props: {
    weekdays: {
      type: Array,
      default: function(){
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      }
    }
  },  
  data() {
    return {
      selectedDate: moment(),
      api_key: "bda5283718881e6ba9344df3baf37384",
      weather_api: "http://api.openweathermap.org/data/2.5/",
      weather_res: {},
      calendar: [],
      form: {
        maxDate: moment().endOf('month').format('YYYY-MM-DD'),
        minDate: moment().startOf('month').format('YYYY-MM-DD'),
        titleMaxLength: 30
      },
      reminder: {
        id: null,
        // Some default Values for faster debug
        // title: "Reminder Title",
        // date: moment().format('YYYY-MM-DD'),
        // time: moment().format('HH:MM'),
        // color: "#1f1f72",
        // city: "New York",
        // weather: ""
        title: "",
        date: moment().format('YYYY-MM-DD'),
        time: moment().format('HH:MM'),
        color: "#1f1f72",
        city: "",
        weather: ""      
      }
    }
  },
  methods: {
    increaseMonth(){
      this.selectedDate.add(1,'months');
      this.form = {
        maxDate: this.selectedDate.endOf('month').format('YYYY-MM-DD'),
        minDate: this.selectedDate.startOf('month').format('YYYY-MM-DD')        
      }
      this.updateCalendar();
    },
    decreaseMonth(){
      this.selectedDate.subtract(1,'months');
      this.form = {
        maxDate: this.selectedDate.endOf('month').format('YYYY-MM-DD'),
        minDate: this.selectedDate.startOf('month').format('YYYY-MM-DD')        
      }      
      this.updateCalendar();
    },
    isToday(day){
      let today = moment().format('YYYYMMMMDD')
      if(this.selectedDate.format('YYYYMMMM')+day == today){
        return true;
      } else {
        return false;
      }
    },
    updateCalendar(){
      let monthArray = [];
      let endOfMonth = parseInt(this.selectedDate.clone().endOf('month').format('DD'));
      let startOfMonthWeekDay = parseInt(this.selectedDate.clone().startOf('month').day());

      let days = (Math.ceil((endOfMonth + startOfMonthWeekDay) / 7) * 7);
      let newMonth = true;


      if(this.calendar.length > 0){
        const storedMonth = this.calendar.filter((m) => m.month === this.selectedDate.format('YYYYMM'));
        if(storedMonth.length > 0) {
          //Forcing vue to refresh the computed property
          this.calendar.push({});
          this.calendar.pop();
          //
          newMonth = false;

        }
      }

      if(newMonth){
        for(let i = 1; i <= days; i++){
          let dayNumber = this.getCorrectDayNumber(i - startOfMonthWeekDay);
          let month = this.selectedDate.format('MMMM');
          let isCurrentMonth = true;
          let isWeekend = false;

          if((i % 7 == 1) || (i % 7 == 0)){
            isWeekend = true;
          }

          if((i - startOfMonthWeekDay <= 0)){
            month = this.selectedDate.clone().subtract(1,'months').format('MMMM');
            isCurrentMonth = false;
          }
          if((i - startOfMonthWeekDay > endOfMonth)){
            month = this.selectedDate.clone().add(1,'months').format('MMMM');
            isCurrentMonth = false;
          }

          let currentDay = {
            month: month,
            dayNumber: dayNumber,
            isCurrentMonth: isCurrentMonth,
            isWeekend: isWeekend,
            reminders: []
          };
          monthArray.push(currentDay);
        }
        let monthToSave = {
          month: this.selectedDate.format('YYYYMM'),
          data: monthArray,
          hasEvents: false
        }

        this.calendar.push(monthToSave);        
      }
    },
    getCorrectDayNumber(val){
      let lastDayOfPrevMonth = parseInt(this.selectedDate.clone().subtract(1,'months').endOf('month').format('DD'));
      let endOfMonth = parseInt(this.selectedDate.clone().endOf('month').format('DD'));

      if(val > 0 && val <= endOfMonth){
        return val 
      } else if(val > endOfMonth){
        return val - endOfMonth
      } else {
        return lastDayOfPrevMonth + val
      }
    },
    clickDay(index, day){
      let str = "";
      let date = "";
      if(day.dayNumber < 10){
        str = "0";
      }

      date = this.selectedDate.format('YYYY-MM-') + str + day.dayNumber;
      this.reminder.date = date;
    },
    reminderClick(reminder){
      this.reminder = reminder;
    },
    getDayObject(date){
      let resp = {
        month: moment(date).format('YYYYMM'),
        day: parseInt(moment(date).format('DD'))
      }

      return resp;
    },
    clearSchedule(day){
      day.reminders = [];
    },
    async onSubmit(e) {
      e.preventDefault()
      let weatherRes;
      let weather
      
      // await fetch(this.weather_api+'forecast?q='+this.reminder.city+'&cnt=10&units=metric&APPID='+this.api_key)
      // Couldn't really find a way to get an exact day... Not to mention the ammount of results is limited to 30 days (ahead from the api call time), so even in the best scenario, its kind of unreliable to use this one (as reminders too much ahead would not have any weather info)
      // Closest Option was a 30 day climate forecast from OpenWeather, but it needs a subscription plan to work, not the free one.
      // So I just set it up using the current weather info at the time of ADDING the reminder, just as a placeholder.
      await fetch(this.weather_api+'weather?q='+this.reminder.city+'&units=metric&APPID='+this.api_key)
           .then(response => response.json())
           .then(data => (weatherRes = data));


      weather = weatherRes.weather[0].main;

      const newReminder = {
        id: this.reminder.id,
        title: this.reminder.title,
        date: this.reminder.date,
        time: this.reminder.time,
        color: this.reminder.color,
        city: this.reminder.city,
        weather: weather
      }

      let whereToAdd = this.getDayObject(this.reminder.date);

      this.addReminder(whereToAdd, newReminder);
      // this.$emit('add-task', newTask)

      // this.text = ''
      // this.day = ''
      // this.reminder = false
    },
    sortReminders: function(ar) {
      function compare(a, b) {
        if (a.time < b.time)
          return -1;
        if (a.time > b.time)
          return 1;
        return 0;
      }

      return ar.sort(compare);
    },      
    addReminder(where, data){
      let monthObj = this.calendar.filter((m) => m.month === where.month);
      let daysArray = monthObj[0].data;
      let dayObj = daysArray.filter((d) => d.dayNumber === where.day);

      if(!data.id){
        data.id = Math.floor(Math.random() * 100000);
        dayObj[0].reminders.push(data);
      } else {
        let editing = dayObj[0].reminders.filter((r) => r.id === data.id);
        editing[0] = data;
      }

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
    removeReminder(reminder){
      let where = this.getDayObject(reminder.date);
      let monthObj = this.calendar.filter((m) => m.month === where.month);
      let daysArray = monthObj[0].data;
      let dayObj = daysArray.filter((d) => d.dayNumber === where.day); 
      let reminders = dayObj[0].reminders;
      let index = reminders.findIndex( r => r.id === reminder.id); 
      reminders.splice(index,1);
    },
  },
  computed: {
    currentMonthData: function() {
      let storedMonth = this.calendar.filter((m) => m.month === this.selectedDate.format('YYYYMM'));
      let name = this.selectedDate.format('MMMM');
      let year = this.selectedDate.format('YYYY');
      return {
        name: name,
        year: year,
        data: storedMonth[0].data
      }
    }  
  },  
  created: function() {
    this.updateCalendar();
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
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
        margin: .2vw 0 .2vw;
        font-size: 1vw;
        font-family: sans-serif;
        text-transform: uppercase;

        button {
          background: #21217a;
          border: none;
          border-radius: .2vw;
          color: #FFF;
          padding: .2vw .5vw;
          transition: all .2s linear;
          cursor: pointer;
          margin: 0 .2vw;

          span {
            font-size: .8em;
            position: relative;
            top: -.05vw;
            display: inline-block;
            margin: 0 .2vw;
          }

          &:hover {
            background: #080843;
          }

        }
      }

      .daysHeader {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: #21217a;
        border-top-left-radius: .5vw;
        border-top-right-radius: .5vw;
        color: #FFF;
        padding: .5vw .2vw;
        font-size: .8vw;
        text-align: center;
        font-family: sans-serif;

        > div {

        }
      }

      .grid-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        max-height: 91vh;
        text-align: left;
        border: 1px solid #21217a;;  
        -webkit-touch-callout: none;
        user-select: none;  
        border-bottom-left-radius: .5vw;
        border-bottom-right-radius: .5vw;  
        overflow: hidden;
        box-shadow: 0px 8px 20px 0px rgba(0,0,0,0.75);

        .dayItem {
          border: 1px solid #21217a;
          position: relative;
          transition: all .2s linear;
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
              opacity: .04;
              pointer-events: none;
          }    

          .clearSchedule {
            position: absolute;
            display: block;
            width: 1vw;
            height: 1vw;
            font-size: .8vw;
            line-height: .8vw;
            text-align: center;
            curspor: pointer;
            z-index: 5;
            top: 0;
            right: 0;
            color: #FFF;
            background: #21217a;
            border-bottom-left-radius: 2vw;
            transition: all .2s linear;

            i {
              transform: rotate(45deg);
              display: block;
              font-size: 1.2em;
            }

            &:hover {
              background: #000;
            }
          }

          .reminders {
            font-size: .7vw;
            margin: 0;
            padding: 1.7em .3em 0 .3em;
            list-style: none;
            height: 100%;    
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            overflow-x: hidden;
            overflow-y: auto;
            
            li {
              padding: .3em .3em .3em .5em;
              border-radius: .3vw;
              color: #333;
              border: 2px solid;
              border-left: 4px solid;
              display: block;
              margin-bottom: .5em;
              background: #FFF;
              -webkit-touch-callout: none;
              user-select: none;
              position: relative;

              .fa-edit {
                position: absolute;
                transition: all .2s linear;
                top: 50%;
                right: 0;
                opacity: 0;
                transform: translateY(-50%) translateX(200%);
              }

              &:hover {
                .fa-edit {
                  transform: translateY(-50%) translateX(-50%);
                  opacity: 1;
                }
              }
            }
          }


          &.isWeekend {
            background: #e5e5e5;

            .dayNumber {
              &.currentMonth {
                color: #1083bc !important;
              }
            }
          }

          &.selected {
            background: #5eb4e1 !important;
          }

          &:hover {
            background: #00000038;
          }

          .dayNumber {
            color: #333;
            opacity: .5;
            font-size: .8vw;
            font-weight: bold;
            position: absolute;
            top: .1vw;
            left: .1vw;

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

    form {
      border: none;
      margin: 0;
      padding: 0;

      fieldset {
        border: none;

        label, input {
          display: block;
          text-align: left;
          width: 100%;
        }
      }
    }
  }
</style>
