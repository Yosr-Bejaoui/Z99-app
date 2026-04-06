const fs = require('fs');
const path = require('path');
const screensDir = 'screens';
const files = fs.readdirSync(screensDir);
files.forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(screensDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // We only want to replace success/copied/error alerts where there are no buttons (i.e. just message and maybe single OK button, which is default).
        // Let's just do a specific set of replacements.
        content = content.replace(/Alert\.alert\('Donation Failed',\s*getErrorMessage\(err\)\);/g, "showToast(`Donation Failed: ${getErrorMessage(err)}`, 'error');");
        content = content.replace(/Alert\.alert\(t\('common\.success'\),\s*t\('forgotPassword\.email\.success'\)\);/g, "showToast(t('forgotPassword.email.success'), 'success');");
        content = content.replace(/Alert\.alert\('Connection Error',\s*'Failed to connect to the server\. Please try again\.'\);/g, "showToast('Connection Error: Failed to connect.', 'error');");
        content = content.replace(/Alert\.alert\('Permission needed',\s*'Please grant camera permission'\);/g, "showToast('Please grant camera permission.', 'warning');");
        content = content.replace(/Alert\.alert\('Copied',\s*'Referral code copied to clipboard'\);/g, "showToast('Referral code copied to clipboard.', 'success');");
        content = content.replace(/Alert\.alert\('Success',\s*'Your password has been changed successfully',\s*\[.*\n.*\]\);/g, "showToast('Your password has been changed successfully.', 'success');");

        fs.writeFileSync(filePath, content);
    }
});
console.log("Done fixing some alerts");