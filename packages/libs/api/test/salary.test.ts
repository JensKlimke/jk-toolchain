import {describe, expect, test} from "@jest/globals";
import {getSalary} from "../src/utils/tax";

describe('Salary API Base Features', () => {

  test('getSalary', async () => {
    const salary = await getSalary();
    expect(salary.monthly).toBe(5224.07);
    expect(salary.annually).toBe(62688.87);
  });

});
