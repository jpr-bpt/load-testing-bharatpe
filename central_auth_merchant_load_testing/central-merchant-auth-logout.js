import { TestFactory } from "../framework/core/TestFactory.js";
const configFile = open('../services_config/central_merchant_auth_service/logout-config.json');
const config = JSON.parse(configFile);
const test = TestFactory.createTest(config, 'logout', 'load');

test.getOptions();
test.init();

export default function() {
    test.run()
}
