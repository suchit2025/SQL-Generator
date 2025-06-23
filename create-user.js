function showOperationForms() {
    const operationType = document.getElementById('operationType').value;
    const userTypeSelectionContainer = document.getElementById('userTypeSelectionContainer');
    const normalUserForm = document.getElementById('normalUserForm');
    const batchUserForm = document.getElementById('batchUserForm');
    const systemUserForm = document.getElementById('systemUserForm');
    const dropUserForm = document.getElementById('dropUserForm');

    // Hide all sections first
    userTypeSelectionContainer.classList.add('hidden');
    normalUserForm.classList.add('hidden');
    batchUserForm.classList.add('hidden');
    systemUserForm.classList.add('hidden');
    dropUserForm.classList.add('hidden');

    if (operationType === 'create') {
        userTypeSelectionContainer.classList.remove('hidden');
    } else if (operationType === 'drop') {
        dropUserForm.classList.remove('hidden');
    }
}

function showUserTypeForm(userType) {
    const userTypeSelectionContainer = document.getElementById('userTypeSelectionContainer');
    const normalUserForm = document.getElementById('normalUserForm');
    const batchUserForm = document.getElementById('batchUserForm');
    const systemUserForm = document.getElementById('systemUserForm');

    // Hide selection and all user type forms
    userTypeSelectionContainer.classList.add('hidden');
    normalUserForm.classList.add('hidden');
    batchUserForm.classList.add('hidden');
    systemUserForm.classList.add('hidden');

    if (userType === 'normal') {
        normalUserForm.classList.remove('hidden');
    } else if (userType === 'batch') {
        batchUserForm.classList.remove('hidden');
    } else if (userType === 'system') {
        systemUserForm.classList.remove('hidden');
    }
}

function generateUserSQL(userType) {
    // Validate form before proceeding
    const form = document.getElementById(userType + 'UserInternalForm');
    if (!form.checkValidity()) {
        // Trigger browser's built-in validation UI
        form.reportValidity();
        // Or show a custom alert:
        // alert('Please fill in all required fields for the ' + userType + ' user.');
        return;
    }

    const lastName = document.getElementById(userType + 'LastName').value;
    const firstName = document.getElementById(userType + 'FirstName').value;
    const userEmail = document.getElementById(userType + 'UserEmail').value;
    const requestorName = document.getElementById(userType + 'RequestorName').value;
    const requestorEmail = document.getElementById(userType + 'RequestorEmail').value;
    const srNumber = document.getElementById(userType + 'SrNumber').value;
    const userCapability = document.getElementById(userType + 'UserCapability').value;
    const userClassification = document.getElementById(userType + 'UserClassification').value;
    const userCapabilityGrouping = document.getElementById(userType + 'UserCapabilityGrouping').value;
    const serviceOwner = document.getElementById(userType + 'ServiceOwner').value;
    const connectType = document.getElementById(userType + 'ConnectType').value;

    const userName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`; // username format: firstname.lastname

    let sql;
    // Default parameters for USERADMIN.CreateUser
    // ('LastName','FirstName','UserName','UserPassword','UserEmailID','UserCostCenter','UserProfile','UserAccount','DefaultRole','DefaultDatabase','SpoolSpace','TempSpace','PermSpace','RequestorName','RequestorEmail','SR_Number','UserCapability','UserClassification','UserCapabilityGrouping','ServiceOwner','Connect_NonConnect','Comments',StmntOut)

    if (userType === 'normal') {
        sql = `call USERADMIN.CreateUser('${lastName}','${firstName}','${userName}','','${userEmail}','','','U_USR','','PR_USR_ST','','Teradata456','','${requestorName}','${requestorEmail}','${srNumber}','${userCapability}','${userClassification}','${userCapabilityGrouping}','${serviceOwner}','${connectType}','',StmntOut);`;
    } else if (userType === 'batch') {
        // Example: Batch users might have different defaults or some fields might be N/A
        // Using specific values for UserProfile, UserAccount, DefaultRole, UserClassification, ConnectType
        sql = `call USERADMIN.CreateUser('${lastName}','${firstName}','${userName}','','${userEmail}','','U_BATCH_PROFILE','U_BATCH_ACC','','PR_BATCH_ST','','Teradata456','','${requestorName}','${requestorEmail}','${srNumber}','${userCapability}','${userClassification}','${userCapabilityGrouping}','${serviceOwner}','${connectType}','Batch User Creation',StmntOut);`;
    } else if (userType === 'system') {
        // Example: System users might have different defaults
        // Using specific values for UserProfile, UserAccount, DefaultRole, UserClassification, ConnectType
        sql = `call USERADMIN.CreateUser('${lastName}','${firstName}','${userName}','','${userEmail}','','U_SYSTEM_PROFILE','U_SYSTEM_ACC','','PR_SYSTEM_ST','','Teradata456','','${requestorName}','${requestorEmail}','${srNumber}','${userCapability}','${userClassification}','${userCapabilityGrouping}','${serviceOwner}','${connectType}','System User Creation',StmntOut);`;
    }

    document.getElementById(userType + 'SqlStatement').textContent = sql;
    const sqlOutput = document.getElementById(userType + 'SqlOutput');
    const copyButton = document.getElementById(userType + 'CopyButton');
    sqlOutput.classList.add('show');
    sqlOutput.classList.remove('hidden');
    copyButton.classList.add('show');
    copyButton.classList.remove('hidden');
}

function copyUserSQL(userType) {
    const sqlStatement = document.getElementById(userType + 'SqlStatement').textContent;
    navigator.clipboard.writeText(sqlStatement).then(() => {
        alert('SQL copied to clipboard!');
    });
}

function generateDropSQL() {
    console.log("generateDropSQL function called"); // Added log
    // Get form values
    const userInput = document.getElementById('databaseUserName').value.trim();
    const reqName = document.getElementById('reqName').value.trim();
    const reqEmail = document.getElementById('reqEmail').value.trim();
    const reqNumber = document.getElementById('reqNumber').value.trim();
    const reqComments = document.getElementById('reqComments').value.trim();
    // const dropType = document.getElementById('dropType').value; // dropType is fixed to 'multiple'
    console.log("Input values:", { userInput, reqName, reqEmail, reqNumber, reqComments });

    // Validate required fields
    if (!userInput || !reqName || !reqEmail || !reqNumber || !reqComments) {
        console.log("Validation failed: Required fields missing."); // Added log
        alert('Please fill in all required fields');
        return;
    }

    // Always treat as multiple users, split by newline and clean up
    const usernames = userInput.split(/[\r\n]+/)
        .map(name => name.trim())
        .filter(name => name !== '');

    console.log("Processed usernames:", usernames); // Added log

    if (usernames.length === 0) {
        console.log("Validation failed: No valid usernames entered."); // Added log
        alert('Please enter at least one valid username');
        return;
    }

    // Generate SQL statements for each username
    const sqlStatements = usernames.map(username => {
        if (!username.includes('.')) {
            console.log(`Validation failed: Invalid username format for: ${username}`); // Added log
            alert(`Invalid username format for: ${username}\nUsername should be in format: firstname.lastname`);
            return null;
        }
        return `CALL useradmin.DropUser('${username}', '${reqName}', '${reqEmail}', '${reqNumber}', '${reqComments}', '', StmntOut);`;
    }).filter(sql => sql !== null);

    console.log("Generated SQL statements:", sqlStatements); // Added log

    if (sqlStatements.length === 0) {
        console.log("No SQL statements generated after format validation."); // Added log
        return;
    }

    const sqlOutput = sqlStatements.join('\n\n');
    
    // Show the output
    const dropSqlOutput = document.getElementById('dropSqlOutput');
    const dropSqlStatement = document.getElementById('dropSqlStatement');
    const dropCopyButton = document.getElementById('dropCopyButton');
    
    dropSqlStatement.textContent = sqlOutput;
    dropSqlOutput.classList.add('show');
    dropSqlOutput.classList.remove('hidden');
    dropCopyButton.classList.add('show');
    dropCopyButton.classList.remove('hidden');
    console.log("SQL output displayed."); // Added log
}

function copyDropSQL() {
    const sqlStatement = document.getElementById('dropSqlStatement').textContent;
    navigator.clipboard.writeText(sqlStatement).then(() => {
        alert('SQL copied to clipboard!');
    });
}

// Info button tooltip logic for drop user form
// This matches the grant/revoke page style

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#dropUserForm .info-btn').forEach(function(btn) {
        // Create tooltip element
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        btn.appendChild(tooltip);

        function updateTooltip() {
            tooltip.textContent = btn.getAttribute('data-info');
        }

        // Show tooltip on hover
        btn.addEventListener('mouseenter', function() {
            updateTooltip();
            btn.classList.add('active');
        });
        btn.addEventListener('mouseleave', function() {
            btn.classList.remove('active');
        });

        // Show tooltip on click (for mobile/focus)
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            updateTooltip();
            btn.classList.toggle('active');
        });
    });

    // Hide all tooltips on document click
    document.addEventListener('click', function() {
        document.querySelectorAll('#dropUserForm .info-btn.active').forEach(function(btn) {
            btn.classList.remove('active');
        });
    });
});
