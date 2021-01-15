require('dotenv').config()
const puppeteer = require('puppeteer');
const moment = require('moment-business-days');
const XLSX = require('xlsx');

const url = 'https://hr.breathehr.com/employees/524792/time_logs/new?identifier=healthcodeltd&log_return_to=dashboard';

moment.updateLocale('us', {
    holidays: ["01/01/2020", "10/04/2020", "13/04/2020", "08/05/2020", "25/05/2020", "31/08/2020", "25/12/2020", "28/12/2020"],
    holidayFormat: 'DD/MM/YYYY',
    workingWeekdays: [1, 2, 3, 4, 5]
});

const startDate = moment('01-01-2020', 'DD-MM-YYYY');
const endDate = moment('31-12-2020', 'DD-MM-YYYY');
const annualLeave = [];

const workbook = XLSX.readFile('Leave.xlsx');
const first_sheet_name = workbook.SheetNames[0];

for (let i = 1; i < 100; i++) {
    const address_of_cell = `A${i}`;
    const worksheet = workbook.Sheets[first_sheet_name];
    const desired_cell = worksheet[address_of_cell];

    if (desired_cell != undefined) {
        const desired_value = desired_cell.v;
        annualLeave.push(moment(desired_value, 'DD/MM/YYYY'));
    }
}

for (let day = startDate; day <= endDate; day.add(1, 'd')) {
    if (day.isHoliday() || annualLeave.includes(day)) {
        logDay(day, "Leave", "LEAVE (inc Bank Holidays)");
    } else {
        console.log("Regular day: " + day);
    }
}

await browser.close();

function logDay(date, description, type) {
    (async () => {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto(url);

        await page.type('#email-input', process.env.EMAIL);
        await page.type('.password-input', process.env.PASSWORD);
        await page.keyboard.press('Enter');

        await page.waitForNavigation({ waitUntil: ['networkidle2'] });
        await page.type('.DateInput_input', date);
        await page.type('#employee_time_log_description', description);
        await page.type('#employee_time_log_hours', '7');
        await page.type('#employee_time_log_company_project_id', type);
        await page.keyboard.press('Enter');

        await page.waitForNavigation({ waitUntil: ['networkidle2'] });
        await page.goto(url);
    })();
}