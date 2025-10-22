import { StyleSheet, Platform } from 'react-native';

const styles = StyleSheet.create({
  // MARK: Containers & Layout
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  baseContainer: {
    flex: 1,
  },
  container: { // Used by default screens
    flex: 1,
    backgroundColor: 'rgba(223, 255, 223, 0.9)', // Light green tint
  },
  darkContainer: { // Used by login/home
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  // FIXED: Changed dark background to transparent to show main app background
  centeredContainer: { 
    flex: 1,
    backgroundColor: 'transparent', // Now transparent to show the light main container
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  groupCreateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 40,
  },
  sliderContainer: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
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
    paddingBottom: Platform.OS === 'web' ? 20 : 40,
  },

  // MARK: Text & Titles
  baseTitle: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'web' ? 50 : 80,
  },
  homeTitle: {
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: 'white',
    marginBottom: 5,
  },
  groupLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    marginTop: 10,
  },
  amountLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000ff',
    marginBottom: 5,
  },
  baseButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyButtonText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backText: {
    color: '#61dafb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pendingText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  message: {
    color: '#61dafb',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    padding: 10,
  },
  actionText: {
    color: '#61dafb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledText: {
    color: '#999',
  },
  name: {
    fontWeight: 'bold',
    color: '#000000ff',
    fontSize: 20,
  },
  detailLabel: {
    fontWeight: 'normal',
    color: '#838383ff',
    fontSize: 14,
    marginTop: 3,
  },
  contactBalance: {
    marginTop: 6,
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  groupRowText: {
    fontWeight: 'bold',
    color: '#2C3E50',
    fontSize: 20,
  },

  // MARK: Inputs
  baseInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  textInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 18,
    color: '#000',
  },
  amountInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 24,
    color: '#000000ff',
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

  // MARK: Buttons
  baseButton: {
    width: 200,
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#61dafb',
  },
  confirmButton: {
    backgroundColor: '#61dafb',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiveButton: {
    backgroundColor: '#4CAF50',
  },
  splitButton: {
    backgroundColor: '#FF9800',
  },
  // UPDATED: Thinner border and transparent background
  historyButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1, // Thinner border
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  denyButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  equalizeButton: {
    backgroundColor: '#61dafb',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
  },
  groupCreateButton: {
    flex: 1,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },

  // MARK: Positional/Utility
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    left: 20,
    zIndex: 10,
  },
  backButtonPadded: {
    padding: 5,
    borderRadius: 4,
  },
  logoutButton: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },

  // MARK: Rows & Lists
  baseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    justifyContent: 'space-between',
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
  groupRow: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 5,
    borderLeftColor: '#61dafb',
  },
  splitSelectedRow: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  disabledRow: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
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

  // MARK: Miscellaneous
  image: {
    width: '80%',
    height: '80%',
  },
  icon: {
    width: 60,
    height: 60,
  },
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
  loadingSpinner: {
    marginTop: 10,
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
  recipientInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  splitConfirmButton: {
    flex: 2,
    marginRight: 10,
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
  cell: {
    flex: 1,
  },
  personShare: {
    width: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default styles;