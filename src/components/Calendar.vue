<template>
  <section>
    <article>
      <span>{{ getCurrentMonth() }}</span>
      <div class="daysHeader">
        <div>Sunday</div>
        <div>Monday</div>
        <div>Tuesday</div>
        <div>Wednesday</div>
        <div>Thursday</div>
        <div>Friday</div>
        <div>Saturday</div>
      </div>
      <div class="days">
        <div @click="dayClicked" :key="n" v-for="n in numberOfDays()" :class="[((n+7) % 7 == 1) || (n % 7 == 0) ? 'isWeekend' : '']">
          <span :class="[(n - startOfMonthWeekDay() > 0) && (n - startOfMonthWeekDay() <= endOfMonth() ) ? 'currentMonth' : '', 'dayNumber']">{{ showDay(n - startOfMonthWeekDay()) }}</span>
          <ul class="events">
            
          </ul>
        </div>
      </div>
    </article>
  </section>
</template>

