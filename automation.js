require('dotenv').config()
const puppeteer = require('puppeteer');
const moment = require('moment-business-days');
const leave = require('./leave');

const url = 'https://hr.breathehr.com/employees/524792/time_logs/new?identifier=healthcodeltd&log_return_to=dashboard';

moment.updateLocale('us', {
    holidays: ["01/01/2020", "10/04/2020", "13/04/2020", "08/05/2020", "25/05/2020", "31/08/2020", "25/12/2020", "28/12/2020"],
    holidayFormat: 'DD/MM/YYYY',
    workingWeekdays: [1, 2, 3, 4, 5]
});

const startDate = moment('01/01/2020', 'DD/MM/YYYY');
const endDate = moment('31/12/2020', 'DD/MM/YYYY');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);

    await page.type('#email-input', process.env.EMAIL);
    await page.type('.password-input', process.env.PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: ['networkidle2'] });

    for (let day = startDate; day <= endDate; day.add(1, 'd')) {
        if (day.isHoliday(day) || leave.annualLeave.includes(day.format('DD/MM/YYYY'))) {
            console.log("Leave/Bank Holiday: " + day.format('DD/MM/YYYY'));
            await logDate(day.format("DD/MM/YYYY"), "Leave", "LEAVE (inc Bank Holidays)", page);
        } else if (day.isBusinessDay()) {
            console.log("Workding day: " + day.format('DD/MM/YYYY'));
            await logDate(day.format("DD/MM/YYYY"), "Work", "General Support", page);
        }
    }
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