/*
 * Language Skills => employee_field5 [Choice List - Multi Select]
 * Language(s) => contact_field3 [Choice List - Multi Select]
 *
 * Employee Team => employee_field13 [Choice List - Multi Select]
 * Lead Type => contact_field101 [Choice List - Single]
 *
 * Lead Type Assigned => employee_field12 [Choice List - Single]
 * Initial Contact Method Requested => contact_field41 [Choice List - Single]
 *   Call  => 931c9a1c-731d-4705-9761-1f25b1dab4ef
 *   Email => c778c239-c2df-4e71-a8f9-b1217de73fb5
 *   Mail  => 9a32df81-f139-4f86-bd0a-2c75a54d1962
 *   Meet  => 719b58f7-8449-4fd5-a4d8-b7464aa92ed2
 *
 * Contact Owner => contact_field80
 *
 */

(async function (contact, context) {

    const EMPLOYEE_FIELDS = {
      user: "employee_field8", // User [Reference][Team Member]
      name: "employee_field10", // Name [Text]
      email: "employee_field3", // Email [Email]
      languageSkills: "employee_field5", // Language Skills [Choice List - Multi Select]
      leadType: "employee_field12", // Lead Type Assigned [Choice List - Single]
      active: "employee_field4", //Active [Boolean]
    };
  
    const CONTACT_FIELDS = {
      languages: "contact_field3", // Language(s) [Choice List - Multi Select]
      initialContactMethodRequested: "contact_field41", // Initial Contact Method Requested [Choice List - Single]
      contactOwner: "contact_field80", //Contact owner
    };
  
    try {
      // return right away if already has Contact Owner
      if (!!contact.contactOwner.id) {
        return {
          alert: "Already has an Employee.",
          contactOwner: contact.contactOwner,
        };
      }
  
      const getAllActiveEmployees = await context.freeagent.listEntityValues({
        entity: "employee",
        fields: [
          "seq_id", // ID
          EMPLOYEE_FIELDS.user, // User [Reference][Team Member]
          EMPLOYEE_FIELDS.name, // Name [Text]
          EMPLOYEE_FIELDS.email, // Email [Email]
          EMPLOYEE_FIELDS.languageSkills, // Language Skills [Choice List - Multi Select]
          EMPLOYEE_FIELDS.employeeTeam, // Employee Team [Choice List - Multi Select]
          EMPLOYEE_FIELDS.leadType, // Lead Type Assigned [Choice List - Single]
        ],
        filters: [
          {
            field_name: EMPLOYEE_FIELDS.active, //Active [Boolean]
            operator: "equals",
            values: ["true"],
          },
        ],
      });
  
      let currentStateOfEmployees = [];
      /*
       * iterate each employee, get count of contacts assigned, and push object of values into
       * currentStateOfEmployees Array created above
       */
      for (const value of getAllActiveEmployees.entity_values) {
        const getAllOwnedContacts = await context.freeagent.listEntityValues({
          entity: "contact",
          fields: Object.values(CONTACT_FIELDS),
          filters: [
            {
              field_name: CONTACT_FIELDS.contactOwner,
              operator: "includes",
              values: [value.id],
            },
          ],
          order: [],
          pattern: "",
          offset: 0,
          limit: 1,
          only_count: true,
        });
  
        currentStateOfEmployees.push({
          user: value.field_values.employee_field8,
          name: value.field_values.employee_field10,
          email: value.field_values.employee_field3,
          languageSkills: value.field_values.employee_field5,
          leadType: value.field_values.employee_field12,
          contactsOwnedCount: getAllOwnedContacts.count,
        });
      }
  
      // reorder so employee with least assigned contacts is [0]
      currentStateOfEmployees.sort((a, b) =>
        a.contactsOwnedCount > b.contactsOwnedCount ? 1 : -1
      );
  
//   return {
//         currentStateOfEmployees: currentStateOfEmployees,
//       };
  
      // filter employees who's langauge && contact method == current users's
      const employeelanguageMatches = currentStateOfEmployees.filter(((employee) =>
        employee.languageSkills.value 
        )
      );
  
    //   let languageContactMethodMatches = currentStateOfEmployees.filter(
    //     (employee) =>
    //       employee.languageSkills.value.filter((language) =>
    //         contact.languageS.ids.includes(language)
    //       ) >= 1 && employee.leadType == contact.initialContactMethodRequested.id
    //   );

      return{
        employeelanguageMatches: employeelanguageMatches
      }
  
      // if no employees found, only look for employee langauge == current user's
      if (languageContactMethodMatches.length == 0) {
        languageContactMethodMatches = currentStateOfEmployees.filter(
          (employee) =>
            employee.languageSkills.value.filter((language) =>
              contact.languageS.ids.includes(language)
            ) >= 1
        );
      }
  
      // if STILL no employees found, only look for contact method == current user's
      if (languageContactMethodMatches.length == 0) {
        languageContactMethodMatches = currentStateOfEmployees.filter(
          (employee) =>
            employee.leadType.id == contact.initialContactMethodRequested.id
        );
      }
  
      return {
        employees: currentStateOfEmployees,
        matches: languageContactMethodMatches,
      };
  
      // assign Contact Owner Employee to contact
      if (languageContactMethodMatches.length != 0) {
        return await context.freeagent.updateEntity({
          entity: "contact",
          id: contact.instanceId,
          field_values: {
            contact_field80: languageContactMethodMatches[0].id,
          },
          skip_get_record: true,
        });
      }
  
      return "Could not find a Match";
    } catch (error) {
      return error;
    }
  })(contact, context);