// Test Authentication Flow
// This file can be run in the browser console to test the authentication system

console.log('🧪 Testing D&D Map Assistant Authentication System...');

// Test 1: Check if authentication buttons exist
function testAuthButtons() {
  console.log('\n📋 Test 1: Authentication Buttons');
  
  const signInButton = document.querySelector('button:contains("Sign In")');
  const signUpButton = document.querySelector('button:contains("Sign Up")');
  
  if (signInButton) {
    console.log('✅ Sign In button found');
  } else {
    console.log('❌ Sign In button not found');
  }
  
  if (signUpButton) {
    console.log('✅ Sign Up button found');
  } else {
    console.log('❌ Sign Up button not found');
  }
}

// Test 2: Test modal opening
function testModalOpening() {
  console.log('\n📋 Test 2: Modal Opening');
  
  // Try to find and click the Sign In button
  const authButtons = Array.from(document.querySelectorAll('button')).filter(
    btn => btn.textContent?.includes('Sign In') || btn.textContent?.includes('Sign Up')
  );
  
  console.log(`Found ${authButtons.length} authentication buttons`);
  
  authButtons.forEach((btn, index) => {
    console.log(`Button ${index + 1}: "${btn.textContent?.trim()}"`);
  });
}

// Test 3: Check if authentication context is available
function testAuthContext() {
  console.log('\n📋 Test 3: Authentication Context');
  
  // Check if the auth context is working by looking for user-related elements
  const userElements = document.querySelectorAll('[class*="user"], [class*="auth"]');
  console.log(`Found ${userElements.length} user/auth related elements`);
  
  // Check for authentication status
  const authStatus = document.querySelector('.auth-status');
  if (authStatus) {
    console.log('✅ Authentication status component found');
    console.log('Status text:', authStatus.textContent?.trim());
  } else {
    console.log('❌ Authentication status component not found');
  }
}

// Test 4: Check navigation structure
function testNavigation() {
  console.log('\n📋 Test 4: Navigation Structure');
  
  const nav = document.querySelector('.landing-nav');
  if (nav) {
    console.log('✅ Navigation found');
    
    const navActions = nav.querySelector('.nav-actions');
    if (navActions) {
      console.log('✅ Navigation actions found');
      console.log('Navigation content:', navActions.textContent?.trim());
    }
  } else {
    console.log('❌ Navigation not found');
  }
}

// Run all tests
function runAllTests() {
  console.log('🏰 D&D Map Assistant Authentication Tests\n');
  console.log('Current URL:', window.location.href);
  console.log('Page title:', document.title);
  
  testAuthButtons();
  testModalOpening();
  testAuthContext();
  testNavigation();
  
  console.log('\n🎯 Test Summary Complete!');
  console.log('To test the authentication flow:');
  console.log('1. Click the "Sign In" button in the navigation');
  console.log('2. Verify the modal opens in login mode');
  console.log('3. Click the "Sign Up" button in the navigation');
  console.log('4. Verify the modal opens in signup mode');
  console.log('5. Test form submission with valid credentials');
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Export for manual testing
window.testAuth = {
  runAllTests,
  testAuthButtons,
  testModalOpening,
  testAuthContext,
  testNavigation
};
