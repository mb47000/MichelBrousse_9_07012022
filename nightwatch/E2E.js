module.exports = {
    Scenario_1: client => {
        client
            .url('http://localhost:8080/')
            .assert.titleContains('Billed')
            .waitForElementVisible('body')
            .click('[data-testid=employee-login-button]')
            .waitForElementVisible('#root')
            .assert.urlEquals('http://localhost:8080/')
            .assert.cssProperty("[data-testid=employee-email-input]", "z-index", "2");
    },

    Scenario_2: client => {
        client
            .url('http://localhost:8080/')
            .waitForElementVisible('body')
            .setValue('[data-testid=employee-email-input]', 'testmauvaisformat')
            .click('[data-testid=employee-login-button]')
            .waitForElementVisible('#root')
            .assert.urlEquals('http://localhost:8080/')
            .assert.cssProperty("[data-testid=employee-email-input]", "z-index", "2");
    },

    Scenario_3: client => {
        client
            .url('http://localhost:8080/')
            .waitForElementVisible('body')
            .setValue('[data-testid=employee-email-input]', 'employee@test')
            .setValue('[data-testid=employee-password-input]', 'employe')
            .click('[data-testid=employee-login-button]')
            .waitForElementVisible('#root')
            .assert.urlEquals('http://localhost:8080/')
    },

    Scenario_4: client => {
        client
            .url('http://localhost:8080/')
            .waitForElementVisible('body')
            .setValue('[data-testid=employee-email-input]', 'employee@test.tld')
            .setValue('[data-testid=employee-password-input]', 'employee')
            .click('[data-testid=employee-login-button]')
            .waitForElementVisible('body')
            .assert.urlEquals('http://localhost:8080/#employee/bills')
    }
}