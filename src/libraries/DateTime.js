import moment from "moment";
import commonConstants from "~/constants/commonConstants";

/**
 * Define DateTime Library
 */
class DateTime {

    /**
     * Convert UTC time to any local time.
     *
     * @param  {String}  time  Format - YYYY-MM-DD HH:mm:ss.
     * @param  {String}  timezone
     * @param  {String}  format
     * @returns {String}
     */
    utcToAnyTimezone(time, timezone, format) {
        const convertedTime = this.changeFormat(time, commonConstants.SYSTEM.DB_DATE_FORMAT);
        return moment.utc(convertedTime).tz(timezone).format(format);
    }

    /**
     * Convert local time to UTC time.
     *
     * @param  {String}  time Format - YYYY-MM-DD HH:mm:ss.
     * @param  {String}  timezone
     * @param  {String}  format
     * @returns {String}
     */
    localToUtc(time, timezone, format) {
        const convertedTime = this.changeFormat(time, commonConstants.SYSTEM.DB_DATE_FORMAT);
        return moment.tz(convertedTime, format, timezone).utc().format(format);
    }

    /**
     * Get the difference between two times.
     *
     * @param  {String}  startTime Format - YYYY-MM-DD HH:mm:ss.
     * @param  {String}  endTime Format - YYYY-MM-DD HH:mm:ss.
     * @returns {Number}
     */
    async getDifference(startTime, endTime) {
        const start = moment(this.changeFormat(startTime, commonConstants.SYSTEM.DB_DATE_FORMAT));
        const end = moment(this.changeFormat(endTime, commonConstants.SYSTEM.DB_DATE_FORMAT));
        const timeDiff = await moment.duration(end.diff(start));
        return {
            "minutes": timeDiff.as("minutes"),
            "hours": timeDiff.as("hours"),
            "weeks": timeDiff.as("weeks"),
            "days": timeDiff.as("days")
        }
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
     * Return total duration from current time.
     *
     * @param  {String}  inputDate
     * @returns {String}
     */
    getTotalDurationFromNow(inputDate) {
        return moment(inputDate).fromNow();
    }

    /**
     * Append duration to a date.
     *
     * @param  {String}  startDate
     * @param  {String}  duration
     * @param  {String}  type 
     * @returns {String}
     */
    appendDaysInDate(startDate, duration, type) {
        const start = moment(this.changeFormat(startDate, commonConstants.SYSTEM.DB_DATE_FORMAT));
        return start.add(duration, type).format(commonConstants.SYSTEM.DB_DATE_FORMAT);
    }

    /**
     * Change timestamp format from database result.
     *
     * @param  {Object} DTObject
     * @param  {String} columnName
     * @param  {String} format
     * @returns {Object}
     */
    async changeDatabaseTimestampFormat(DTObject, columnName, format) {
        return Promise.all(
            DTObject.map((row) => {
                row[columnName] = this.changeFormat(row[columnName], format);
                return row;
            })
        );
    }

    /**
     * Get the difference between two utc datetimes in minutes.
     *
     * @param  {String}  startTime Format - YYYY-MM-DD HH:mm:ss.
     * @param  {String}  endTime Format - YYYY-MM-DD HH:mm:ss.
     * @returns {Number}
     */
    async getDifferenceInMinutes(startTime, endTime) {
        const start = moment.utc(startTime, "YYYY-MM-DD HH:mm:ss");
        const end = moment.utc(endTime, "YYYY-MM-DD HH:mm:ss");

        const minutes = await moment.duration(end.diff(start)).as("minutes");
        return Math.abs(minutes);
    }
}

module.exports = DateTime;