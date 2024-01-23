 const loginChecks = (user) => {
  // console.log("ROLE:", currentrole, "USER:", user);
  if (!user.verified) {
    return "email-unverified";
    // } else if (user.role === "guardian" && !user.isGuardianActive) {
    //   return "guardian-setup-pending";
  } else if (!user.name) {
    return "account-setup-pending";
  } else {
    return "login-granted";
  }
};

module.exports = {
  loginChecks,
};
