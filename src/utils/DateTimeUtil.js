import moment from "moment-timezone";
import commonConstants from '~/constants/commonConstants';

/**
 * Static DateTimeUtil class.
 */
class DateTimeUtil {
    /**
     * Helper method to convert current timestamp to postgres timstamp.
     *
     * @returns {Object} The resultant snake_case object.
     */
    getCurrentTimeObjForDB() {
        const currentTime = new Date(),
            format = "YYYY-MM-DD HH:mm:ss";

        return moment(currentTime, format)
            .utc()
            .format(format);
    }

    /**
     * Helper method to add minuts in current timestamp.
     *
     * @param {Object} minutesData
     * @returns {Object} The resultant snake_case object.
     */
    getCurrentWithAddMinutes(minutesData) {
        const currentTime = new Date(),
            format = "YYYY-MM-DD HH:mm:ss";

        return moment(currentTime, format)
            .add(minutesData, "minutes")
            .utc()
            .format(format);
    }

    /**
     * Helper method to add minuts in current timestamp.
     *
     * @param {Object} minutesData
     * @returns {Object} The resultant snake_case object.
     */
    getCurrentWithAddMonths(minutesData) {
        const currentTime = new Date(),
            format = "YYYY-MM-DD HH:mm:ss";

        return moment(currentTime, format)
            .add(minutesData, "months")
            .utc()
            .format(format);
    }

    /**
     * Helper method to return current timestamp for cron.
     *
     * @returns {Object}
     */
    getCurrentTimeObjForCron() {
        const currentTime = new Date(),
            format = "YYYY-MM-DD HH:mm:ss A";

        return moment(currentTime, format)
            .utc()
            .format(format);
    }

    /**
     * Helper method to get current year.
     *
     * @returns {Object} 
     */
    getCurrentYear() {
        const year = new Date(),
            format = "YYYY";

        return moment(year, format)
            .utc()
            .format(format);
    }

    /**
     * Helper method to get current date.
     *
     * @returns {Object} 
     */
    getCurrentDate() {
        const date = new Date(),
            format = "YYYY-MM-DD";


        return moment(date, format)
            .utc()
            .format(format);
    }

    /**
     * Helper method to get current date.
     *
     * @returns {Object} 
     */
    getCurrentTime() {
        const date = new Date(),
            format = "HH:mm:ss";


        return moment(date, format)
            .utc()
            .format(format);
    }

    /**
    * Helper method to get the current local time.
    *
    * @returns {string} 
    */
    getLocalCurrentTime() {
        const date = new Date();
        const format = "HH:mm:ss";
        return moment(date).format(format);
    }


    /**
     * Get a formatted date.
     *
     * @param  {String}  inputDate
     * @param  {String}  format
     * @returns {String}
     */
    changeFormat(inputDate, format) {
        return moment(inputDate).format(format);
    }

    /**
     * Helper method to get next year.
     *
     * @returns {Object} 
     */
    getNextYear() {
        const nextYear = new Date(),
            format = "YYYY";

        return moment(nextYear, format)
            .add(1, "y")
            .utc()
            .format(format);
    }

    /**
    * Get differnce between time
    *
    * @returns {Object} 
    */
    getTimeDiffernce(times, dates) {

        // Current date and time
        const currentTime = moment();

        // date and time
        const date = moment(dates);
        const time = moment(times, 'HH:mm:ss');

        // Combine the date and time
        const dateTime = moment({
            year: date.year(),
            month: date.month(),
            day: date.date(),
            hour: time.hours(),
            minute: time.minutes(),
            second: time.seconds()
        });

        // Calculate the difference in milliseconds
        const differenceInMilliseconds = dateTime.diff(currentTime);

        // Convert milliseconds to minutes
        const differenceInMinutes = moment.duration(differenceInMilliseconds).asMinutes();

        return Math.round(differenceInMinutes);
    }

    getTimeRangeAfterOneHour() {
        const format = "HH:mm:ss"; // Include seconds in the format

        // Current time
        const currentTime = moment().utc();

        // Time after 1 hour, setting seconds to 00
        const startTime = currentTime.clone().add(1, 'hours').startOf('minute').format(format);

        // Time after 2 hours, setting seconds to 59
        const endTime = currentTime.clone().add(2, 'hours').startOf('minute').subtract(1, 'second').format(format);

        return { startTime, endTime };
    }

    isValidTimeFormat(time) {
        return moment(time, 'HH:mm:ss', true).isValid();
    }

    /**
     * 
     * method to compare given date by current timestamp in utc
     * @param {String} date 
     * @param {String} format 
     * @returns 
     */
    async compareDateByCurrentDate(date = new Date(), format = 'YYYY-MM-DD') {
        // Format the input date as a moment object
        const inputDate = moment(date, format),
            response = {
                isBefore: false,
                isSame: false,
                isAfter: false
            };

        if (inputDate.isBefore(moment().utc(), 'day')) { // Checking past date
            response.isBefore = true;
        } else if (inputDate.isSame(moment().utc(), 'day')) { // Checking it's today or not
            response.isSame = true;
        } else { // Checking future date
            response.isAfter = true;
        }
        return response;
    }

    async compareTwoTimes(time2, time1 = '', format = 'HH:mm') {
        const currentTime = time1 ? moment(time1).utc() : moment().utc(); // Set default current time
        const givenMoment = moment(time2, format);
        // Normalize both to only compare time (ignoring date)
        const currentNormalized = moment(currentTime.format("HH:mm"), "HH:mm");
        const givenNormalized = moment(givenMoment.format("HH:mm"), "HH:mm");

        const response = {
            isBefore: false,
            isSame: false,
            isAfter: false,
            minutes: false,
            hours: false
        };

        if (givenNormalized.isBefore(currentNormalized)) {
            response.isBefore = true;
        } else if (givenNormalized.isSame(currentNormalized)) {
            response.isSame = true;
        } else {
            response.isAfter = true;
            // Calculate the difference in minutes
            response.minutes = await givenNormalized.diff(currentNormalized, "minutes");
            if (response.minutes > 60) {
                response.hours = givenNormalized.diff(currentNormalized, "hours");
            }
        }

        return response;
    }

    /**
     * Helper method to get timstamp according timezone.
     *
     * @returns {String}
     */
    getDateTimeByTimezone(timezone = '') {
        const currentTime = new Date(),
            format = "YYYY-MM-DD HH:mm:ss";

        return moment(currentTime, format)
            // .utc()
            .tz(timezone)
            .format(format);
    }

    /**
     * Convert UTC date, time to any local timezone.
     *
     * @param  {String}  timezone 
     * @param  {String}  date  
     * @param  {String}  time 
     * @param  {String}  dateFormat  Format - YYYY-MM-DD
     * @param  {String}  timeFormat  Format - HH:mm
     * @returns {String}
     */
    async convertDateTimeToGivenTimezone(timezone, date, time, dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm') {
        const dateTime = moment(`${date} ${time}`).format(`${dateFormat} ${timeFormat}`);
        const convertedDateTime = await moment.utc(dateTime).tz(timezone);
        return await {
            "date": convertedDateTime.format(dateFormat),
            "time": convertedDateTime.format(timeFormat),
            "datetime": convertedDateTime.format(commonConstants.SYSTEM.DB_DATE_FORMAT)
        };
    }

    /**
     * Helper method to add time units in given timestamp.
     *
     * @param {Number} addData
     * @param {String} timeUnit
     * @param {Object} timestamp
     * @returns {Object} The resultant snake_case object.
     */
    timestampWithAddData(addData, timestamp = new Date(), timeUnit = "minutes", format = "YYYY-MM-DD HH:mm:ss") {

        return moment(timestamp, format)
            .add(addData, timeUnit).format(format);
    }

}

/**
 * @module
 * @type {DateTimeUtil}
 */
module.exports = DateTimeUtil;
