document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const roleNameInput = document.getElementById('roleName');
    const expiryDateInput = document.getElementById('expiryDate');
    const accessTypeSelect = document.getElementById('accessType');
    const revokeCheckbox = document.getElementById('revokeRole');
    const generateBtn = document.getElementById('generate');
    const output = document.getElementById('output');
    const copyBtn = document.getElementById('copyBtn');

    // Set today's date as min for expiry date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    expiryDateInput.min = `${yyyy}-${mm}-${dd}`;

    // Helper function to check if a role is restricted
    function isRestrictedRole(roleNameStr) {
        const trimmedRole = roleNameStr.trim();
        return trimmedRole.endsWith('_R') || trimmedRole.includes('_R_');
    }

    // Function to validate form
    function validateForm() {
        const isRevoke = revokeCheckbox.checked;
        const usernameValue = usernameInput.value.trim();
        const roleName = roleNameInput.value.trim();
        const expiryDate = expiryDateInput.value;
        
        if (!usernameValue || !roleName) {
            return false;
        }

        // Validate username format (firstname.lastname)
        const usernames = usernameValue.split('\n').map(u => u.trim()).filter(Boolean);
        if (usernames.length > 0) {
            for (const u of usernames) {
                if (!u.includes('.')) {
                    return false; // Invalid format
                }
            }
        }
        
        if (!isRevoke && !expiryDate) {
            // For grant, we need expiry date
            const hasRestrictedRole = roleName.split('\n').some(role => isRestrictedRole(role));
            if (hasRestrictedRole) {
                return false;
            }
        }
        
        return true;
    }

    // Function to update button state
    function updateGenerateButton() {
        generateBtn.disabled = !validateForm();
    }

    // Hide/show expiry and access type based on revoke checkbox
    revokeCheckbox.addEventListener('change', function() {
        if (revokeCheckbox.checked) {
            expiryDateInput.parentElement.style.display = 'none';
            accessTypeSelect.parentElement.style.display = 'none';
            expiryDateInput.required = false;
            accessTypeSelect.required = false;
        } else {
            expiryDateInput.parentElement.style.display = '';
            accessTypeSelect.parentElement.style.display = '';
            expiryDateInput.required = true;
            accessTypeSelect.required = true;
        }
        // Update the parameter information display based on grant/revoke state
        updateParameterInfo(this.checked);
        updateGenerateButton();
    });

    // Add input event listeners for validation
    [usernameInput, roleNameInput, expiryDateInput].forEach(input => {
        input.addEventListener('input', updateGenerateButton);
    });

    // Parameter information for grant and revoke operations
    const grantParams = [
        { name: 'TeradataID', desc: 'Username to which access is to be granted.' },
        { name: 'RoleName', desc: 'Role(s) to be assigned. Can be restricted or non-restricted.' },
        { name: 'ExpiryDate', desc: 'Required only for restricted roles.' },
        { name: 'Operation_Mode', desc: "Use 'N' for new users (no prior access), and 'E' for existing users (access extension)." },
        { name: 'AccessType', desc: "Specify access type: 'R' for Restricted, 'NR' for Non-Restricted." },
        { name: 'StmntOut', desc: 'Output parameter that returns the status of execution.' }
    ];

    const revokeParams = [
        { name: 'TeradataID', desc: 'Username from whom the access will be revoked.' },
        { name: 'RoleName', desc: 'Role(s) to be revoked (can be restricted or non-restricted).' },
        { name: 'Valid_only', desc: "Use 'V' to validate the query without running it. If it returns success, the inputs are correct." },
        { name: 'StmntOut', desc: 'Shows the execution status after the query runs.' }
    ];

    function updateParameterInfo(isRevoke) {
        const parameterInfo = document.querySelector('.parameter-info');
        if (!parameterInfo) return;

        const params = isRevoke ? revokeParams : grantParams;

        parameterInfo.innerHTML = ''; // Clear existing parameter items

        // Add new parameter items
        params.forEach(param => {
            const paramItem = document.createElement('div');
            paramItem.className = 'param-item';
            paramItem.innerHTML = `
                <div class="param-name">${param.name}</div>
                <div class="param-desc">${param.desc}</div>
            `;
            parameterInfo.appendChild(paramItem);
        });
    }

    // Initial validation
    updateGenerateButton();
    // Initialize parameter info
    updateParameterInfo(false);

    generateBtn.addEventListener('click', function() {
        const usernames = usernameInput.value.trim().split('\n').map(u => u.trim()).filter(Boolean);
        const roleNames = roleNameInput.value.trim().split('\n').map(r => r.trim()).filter(Boolean);
        const expiryDate = expiryDateInput.value;
        const accessType = accessTypeSelect.value;
        const isRevoke = revokeCheckbox.checked;

        let sqlStatements = [];

        if (usernames.length === 0 || roleNames.length === 0) {
            output.textContent = 'Please enter at least one username and one role name.';
            return;
        }

        // Validate username format before proceeding
        for (const username of usernames) {
            if (!username.includes('.')) {
                output.textContent = `Invalid username format for: ${username}. Please use firstname.lastname format.`;
                copyBtn.style.display = 'none';
                return;
            }
        }


        for (const username of usernames) {
            for (const roleName of roleNames) {
                const roleType = isRestrictedRole(roleName) ? 'R' : 'NR';
                if (isRevoke) {
                    sqlStatements.push(`CALL dbadmin.RevokeRole_v15('${username}', '${roleName}', '', StmntOut);`);
                } else {
                    if (!expiryDate && roleType === 'R') {
                        output.textContent = 'Please select an expiry date for restricted roles.';
                        copyBtn.style.display = 'none';
                        return;
                    }
                    const expiry = roleType === 'R' ? `'${expiryDate}'` : "''";
                    sqlStatements.push(`CALL dbadmin.GrantRole_v16('${username}', '${roleName}', ${expiry}, '', '${accessType}', '${roleType}', StmntOut);`);
                }
            }
        }

        output.textContent = sqlStatements.join('\n');
        copyBtn.style.display = sqlStatements.length > 0 ? 'inline-block' : 'none';
    });

    copyBtn.addEventListener('click', function() {
        if (!output.textContent) return;
        navigator.clipboard.writeText(output.textContent)
            .then(() => {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    });

    // Tooltip logic for info buttons
    document.querySelectorAll('.info-btn').forEach(function(btn) {
        // Create tooltip element
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        btn.appendChild(tooltip);

        function updateTooltip() {
            const isRevoke = document.getElementById('revokeRole')?.checked;
            tooltip.textContent = isRevoke
                ? btn.getAttribute('data-info-revoke')
                : btn.getAttribute('data-info-grant');
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
        document.querySelectorAll('.info-btn.active').forEach(function(btn) {
            btn.classList.remove('active');
        });
    });

    // Update tooltips if revoke checkbox changes
    document.getElementById('revokeRole')?.addEventListener('change', function() {
        document.querySelectorAll('.info-btn.active').forEach(function(btn) {
            const tooltip = btn.querySelector('.tooltip');
            if (tooltip) {
                tooltip.textContent = this.checked
                    ? btn.getAttribute('data-info-revoke')
                    : btn.getAttribute('data-info-grant');
            }
        }, this);
    });
});
