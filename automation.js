require('dotenv').config()
const puppeteer = require('puppeteer');
const moment = require('moment-business-days');
const leave = require('./leave');

const url = process.env.URL;

const ukDateFormat = 'DD/MM/YYYY';

moment.updateLocale('us', {
    holidays: ["01/01/2020", "10/04/2020", "13/04/2020", "08/05/2020", "25/05/2020", "31/08/2020", "25/12/2020", "28/12/2020"],
    holidayFormat: ukDateFormat,
    workingWeekdays: [1, 2, 3, 4, 5]
});

const startDate = moment('01/01/2020', ukDateFormat);
const endDate = moment('31/12/2020', ukDateFormat);

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);
    await page.type('#email-input', process.env.EMAIL);
    await page.type('.password-input', process.env.PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: ['networkidle2'] });

    let day = startDate;

    for (day; day <= endDate; day.add(1, 'd')) {
        const isBankHolidayOrLeaveDay = day.isHoliday() || leave.annualLeave.includes(day.format(ukDateFormat));
        const isBusinessDay = day.isBusinessDay();

        if (isBankHolidayOrLeaveDay) {
            console.log("holiday");
            await logDate(day.format(ukDateFormat), "Leave", "LEAVE (inc Bank Holidays)", page);
        } else if (isBusinessDay) {
            console.log("business day");
            await logDate(day.format(ukDateFormat), "Work", "General Support", page);
        }
    }
    await browser.close();
})();

async function logDate(day, description, type, page) {
    try {
        await page.type('.DateInput_input', day);
        await page.type('#employee_time_log_description', description);
        await page.type('#employee_time_log_hours', '7');
        await page.type('#employee_time_log_company_project_id', type);
        await page.keyboard.press('Enter');
        await page.waitForNavigation({ waitUntil: ['networkidle2'] });
        await page.goto(url);
    } catch (err) {
        console.log(err);
    }
}