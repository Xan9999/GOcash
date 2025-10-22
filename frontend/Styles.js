import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  image: {
    width: '80%',   //  ensures image scales relative to button
    height: '80%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  homeContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row', // Change to row layout
    justifyContent: 'space-evenly', // Evenly space buttons
    alignItems: 'center',
    marginTop: 200, // Move buttons lower
    width: '100%', // Full width to allow even spacing
  },
  sendButton: {
    backgroundColor: '#61dafb',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 200,
    overflow: 'hidden',
  },
  receiveButton: {
    backgroundColor: '#4CAF50',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: 200,
    overflow: 'hidden',
  },
  splitButton: {
    backgroundColor: '#FF9800',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    width: 200,
  },
  pendingButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  pendingText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    zIndex: 10, // Increased zIndex to prevent overlap
  },
  // NEW: Add padding/margin to Back button to prevent overlap
  backButtonPadded: {
    padding: 5,
    borderRadius: 4,
  },
  backText: {
    color: '#61dafb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'web' ? 50 : 80, // Increased top margin
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  recipientInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },  
  amountLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000ff',
    marginBottom: 5,
  },

  // NEW: Style for Group Creation Label - much larger
  groupLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    marginTop: 10,
  },
    amountInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 24,
    color: '#000000ff',
  },
  textInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    color: '#000',
  },
  textInputDisplay: {
    backgroundColor: '#f9f9f9', 
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    color: '#444',
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 50,
    marginTop: 5,
  },
  transactionSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    marginHorizontal: 20,
  },
  summaryText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#61dafb',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  list: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  loginRow: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loginDetail: {
    fontSize: 14,
    color: '#666',
  },
  // Used by ContactsScreen and SplitSelectionScreen
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 7, // Increased vertical margin for spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  requestInfo: {
    flex: 2,
  },
  requestRequester: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  requestAmount: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  requestButtons: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  approveText: {
    color: 'white',
    fontWeight: 'bold',
  },
  denyButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  denyText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sliderContainer: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
  },
  personShare: {
    width: 150, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  equalizeButton: {
    backgroundColor: '#61dafb',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  splitSelectHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  splitSelectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  splitSelectCount: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  rowTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitSelectedRow: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  disabledRow: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  cell: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    color: '#000000ff',
    fontSize: 20, // Slightly smaller for better fit
  },
  label: {
    fontWeight: 'normal',
    color: '#838383ff',
    fontSize: 14,
    marginTop: 3,
  },
  // NEW: Prominent balance text for contacts
  contactBalance: {
    marginTop: 6,
    color: '#007AFF', // Blue color for positive attention
    fontWeight: 'bold',
    fontSize: 14,
  },
  // NEW: Style for group names in list
  groupRowText: {
    fontWeight: 'bold',
    color: '#2C3E50', // Darker color for groups
    fontSize: 20,
  },
  actionText: {
    color: '#61dafb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledText: {
    color: '#999',
  },
  message: {
    color: '#61dafb',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    padding: 10,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingSpinner: {
    marginTop: 10,
  },
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  groupCreateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30, // Increased margin
    marginBottom: 40,
  },
  // User's additions
  groupRow: {
    backgroundColor: '#e6f7ff', 
    borderLeftWidth: 5,
    borderLeftColor: '#61dafb',
  },
  splitSelectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(40, 44, 52, 0.95)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'web' ? 20 : 40, // More padding for mobile safety area
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  splitConfirmButton: {
    flex: 2, 
    marginRight: 10,
  },
  groupCreateButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  homeTitle: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // evenly space buttons across screen
    alignItems: 'center',
    width: '100%',                  // make sure it spans full width
    paddingHorizontal: 20,          // slight margin from screen edges
    marginTop: 30,
  },
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4bd1bbff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 60,            // adjust size of icons as needed
    height: 60,
    // tintColor: '#fff',    // make icons white (optional)
  },
    rotatedIcon: {
    transform: [{ rotate: '180deg' }], // 👈 rotates the image 180°
  },

});

export default styles;
