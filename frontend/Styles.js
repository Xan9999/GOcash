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
  container_splitconfirm_buttons: {
    flexDirection: 'row',
    padding: 20,
    height: 100,
    position: 'absolute',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'space-between',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'web' ? 10 : 30
  },
  requestButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    padding: 20,
    bottom: 0,
    left: 0,
    right: 0,
  },
  splitconfirm_button: {
    position: 'relative',
    backgroundColor: 'green',
    width: '49%',
    height: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,    
    borderRadius: 8,  
  },
  confirmRequestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    alignSelf: 'center',
  },
  denyRequestButton: {
    backgroundColor: 'transparent',
    color: 'green',
    padding: 10,
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 50,
    borderWidth: 3,
    borderColor: 'green',
    width: '49%',

  },
  confirmRequestButton: {
    backgroundColor: 'green',
    padding: 10,
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 50,
    width: '49%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(235, 248, 235, 0.9)',
  },
  darkContainer: {
    flex: 1,
    backgroundColor: 'rgba(40, 44, 52, 0.5)',
  },
  centeredContainer: { 
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    alignItems: 'stretch',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 25, // lift it slightly above screen edge
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  transactionAmountContainer: {
    justifyContent: 'right',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  list: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  splitSelectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
    position: 'absolute',
    alignItems: 'center',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'web' ? 10 : 30,

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
    color: 'green',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 80,
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
  emptyButtonText: {
    color: 'green',
    textAlign: 'center',
    textAlignVertical: 'center',
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
  amountdetailLabelRight: {
    fontWeight: 'bold',
    color: '#000000ff',
    fontSize: 16,
  },
  groupRowText: {
    fontWeight: 'bold',
    color: 'green',
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
    textAlign: 'center', 
  },
  amountContainer: {
    alignSelf: 'center',
  },
  amountdetailLabel: {
    fontWeight: 'bold',
    alignSelf: 'center',
    top: -10,
  },
  amountInput: {
    backgroundColor: 'transparent',  // No white background
    paddingTop: 15,
    paddingBottom: 2,
    paddingHorizontal: 0,
    borderBottomWidth: 1,            // Thin underline
    borderBottomColor: '#000',       // Black underline
    fontSize: 24,
    color: '#000',                    // Text color
    textAlign: 'center',              // Horizontally center text
    textAlignVertical: 'center',      // Vertically center text (Android only)
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
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#61dafb',
  },
  confirmButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 8,
    height: 50,
    width: '66%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiveButton: {
    backgroundColor: 'green',
  },
  transferAmount: {    
    backgroundColor: 'transparent',  // No white background
    paddingHorizontal: 0,
    borderBottomColor: '#000',       // Black underline
    fontSize: 24,
    color: '#000',                    // Text color
    textAlign: 'center',              // Horizontally center text
    textAlignVertical: 'center',      // Vertically center text (Android only)
  },

  // UPDATED: Thinner border and transparent background
  historyButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1, // Thinner border
    borderColor: 'green',
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
    backgroundColor: 'green',
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
    flexDirection: 'row',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    width: '33%',
    height: 50,
    padding: 15,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'green',
  },

  // MARK: Positional/Utility
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,

  },

  topRightButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
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
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 5,
    borderLeftColor: 'green',
  },
  splitSelectedRow: {
    borderWidth: 2,
    borderColor: 'green',
  },
  disabledRow: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  personRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
    paddingHorizontal: 10,
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
  logoIcon: {
    width: 240, // Smaller than circle button icons
    height: 240,
  },

  icon: {
    width: 40,
    height: 40,
    tintColor: 'rgba(234, 255, 234, 0.9)',
  },
  chatIcon: {
    position: 'absolute',
    top: 50, // Adjust based on your header/status bar
    right: 20,
    zIndex: 10, // Ensure it's above other elements
  },
  headerIcon: {
    width: 40, // Smaller than circle button icons
    height: 40,
    tintColor: 'green', // DarkGreen to match the Flik 2 title
  },
  userIcon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 10, // reduced space below the icon
  },
  button_group_Icon: {
    resizeMode: 'contain',
    width: 22, // Smaller than circle button icons
    height: 22,
    tintColor: 'green', // DarkGreen to match the Flik 2 title
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
    paddingBottom: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center', // centers children horizontally
  },

  recipientName: {
    fontSize: 24,       // big text
    fontWeight: 'bold', // bold
    textAlign: 'center',
    marginBottom: 5,    // space between name and phone
  },

  recipientPhone: {
    fontSize: 24,       // same size as name
    fontWeight: 'normal', // not bold
    textAlign: 'center',
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
    color: 'green',
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
    color: 'black',
    fontWeight: 'bold',
    color: 'green',
  },
  splitSelectCount: {
    fontSize: 14,
    color: '#3f3f3fff',
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