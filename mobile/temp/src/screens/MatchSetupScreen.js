'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports['default'] = MatchSetupScreen;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactNative = require('react-native');

var _lucideReactNative = require('lucide-react-native');

var _expoBlur = require('expo-blur');

var _expoLinearGradient = require('expo-linear-gradient');

function MatchSetupScreen(_ref) {
  var navigation = _ref.navigation;

  var _useState = (0, _react.useState)('Strikers');

  var _useState2 = _slicedToArray(_useState, 2);

  var teamA = _useState2[0];
  var setTeamA = _useState2[1];

  var _useState3 = (0, _react.useState)('Spartans');

  var _useState32 = _slicedToArray(_useState3, 2);

  var teamB = _useState32[0];
  var setTeamB = _useState32[1];

  var _useState4 = (0, _react.useState)('T20');

  var _useState42 = _slicedToArray(_useState4, 2);

  var format = _useState42[0];
  var setFormat = _useState42[1];

  var _useState5 = (0, _react.useState)('20');

  var _useState52 = _slicedToArray(_useState5, 2);

  var overs = _useState52[0];
  var setOvers = _useState52[1];

  var _useState6 = (0, _react.useState)(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);

  var _useState62 = _slicedToArray(_useState6, 2);

  var teamARoster = _useState62[0];
  var setTeamARoster = _useState62[1];

  var _useState7 = (0, _react.useState)(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6']);

  var _useState72 = _slicedToArray(_useState7, 2);

  var teamBRoster = _useState72[0];
  var setTeamBRoster = _useState72[1];

  var _useState8 = (0, _react.useState)('Team A');

  var _useState82 = _slicedToArray(_useState8, 2);

  var tossWinner = _useState82[0];
  var setTossWinner = _useState82[1];

  var _useState9 = (0, _react.useState)('BAT');

  var _useState92 = _slicedToArray(_useState9, 2);

  var tossDecision = _useState92[0];
  var setTossDecision = _useState92[1];

  var battingTeamName = tossWinner === 'Team A' ? tossDecision === 'BAT' ? teamA : teamB : tossDecision === 'BAT' ? teamB : teamA;
  var bowlingTeamName = tossWinner === 'Team A' ? tossDecision === 'BOWL' ? teamA : teamB : tossDecision === 'BOWL' ? teamB : teamA;
  var battingRoster = battingTeamName === teamA ? teamARoster : teamBRoster;
  var bowlingRoster = bowlingTeamName === teamA ? teamARoster : teamBRoster;

  var _useState10 = (0, _react.useState)('');

  var _useState102 = _slicedToArray(_useState10, 2);

  var striker = _useState102[0];
  var setStriker = _useState102[1];

  var _useState11 = (0, _react.useState)('');

  var _useState112 = _slicedToArray(_useState11, 2);

  var nonStriker = _useState112[0];
  var setNonStriker = _useState112[1];

  var handleStart = function handleStart() {
    if (!striker || !nonStriker) return _reactNative.Alert.alert('Error', 'Please select both opening batsmen.');
    if (striker === nonStriker) return _reactNative.Alert.alert('Error', 'Striker and Non-Striker must be different players.');

    navigation.navigate('LiveCamera', {
      sessionType: 'MATCH',
      matchDetails: {
        teamA: teamA, teamB: teamB, format: format, overs: parseInt(overs) || 20,
        toss: { winner: tossWinner, decision: tossDecision }
      },
      battingTeam: { name: battingTeamName, roster: battingRoster },
      bowlingTeam: { name: bowlingTeamName, roster: bowlingRoster },
      openingBatsmen: { striker: striker, nonStriker: nonStriker }
    });
  };

  return _react2['default'].createElement(
    _expoLinearGradient.LinearGradient,
    { colors: ['#0a192f', '#020c1b'], style: styles.container },
    _react2['default'].createElement(
      _reactNative.SafeAreaView,
      { style: { flex: 1 } },
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.header },
        _react2['default'].createElement(_lucideReactNative.Trophy, { color: '#00e676', size: 28 }),
        _react2['default'].createElement(
          _reactNative.Text,
          { style: styles.headerTitle },
          'MATCH SETUP'
        )
      ),
      _react2['default'].createElement(
        _reactNative.ScrollView,
        { style: styles.content, contentContainerStyle: { paddingBottom: 50 } },
        _react2['default'].createElement(
          _expoBlur.BlurView,
          { intensity: 40, tint: 'dark', style: styles.section },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.sectionTitle },
            'TEAMS & FORMAT'
          ),
          _react2['default'].createElement(
            _reactNative.View,
            { style: styles.inputRow },
            _react2['default'].createElement(
              _reactNative.View,
              { style: styles.halfInput },
              _react2['default'].createElement(
                _reactNative.Text,
                { style: styles.label },
                'Team A'
              ),
              _react2['default'].createElement(_reactNative.TextInput, { style: styles.input, value: teamA, onChangeText: setTeamA, placeholderTextColor: '#666' })
            ),
            _react2['default'].createElement(
              _reactNative.Text,
              { style: styles.vsText },
              'VS'
            ),
            _react2['default'].createElement(
              _reactNative.View,
              { style: styles.halfInput },
              _react2['default'].createElement(
                _reactNative.Text,
                { style: styles.label },
                'Team B'
              ),
              _react2['default'].createElement(_reactNative.TextInput, { style: styles.input, value: teamB, onChangeText: setTeamB, placeholderTextColor: '#666' })
            )
          ),
          _react2['default'].createElement(
            _reactNative.View,
            { style: styles.inputRow },
            _react2['default'].createElement(
              _reactNative.View,
              { style: styles.halfInput },
              _react2['default'].createElement(
                _reactNative.Text,
                { style: styles.label },
                'Format'
              ),
              _react2['default'].createElement(
                _reactNative.View,
                { style: styles.toggleGroup },
                _react2['default'].createElement(
                  _reactNative.TouchableOpacity,
                  { style: [styles.toggleBtn, format === 'T20' && styles.toggleActive], onPress: function () {
                      return setFormat('T20');
                    } },
                  _react2['default'].createElement(
                    _reactNative.Text,
                    { style: [styles.toggleText, format === 'T20' && styles.toggleTextActive] },
                    'T20'
                  )
                ),
                _react2['default'].createElement(
                  _reactNative.TouchableOpacity,
                  { style: [styles.toggleBtn, format === 'Custom' && styles.toggleActive], onPress: function () {
                      return setFormat('Custom');
                    } },
                  _react2['default'].createElement(
                    _reactNative.Text,
                    { style: [styles.toggleText, format === 'Custom' && styles.toggleTextActive] },
                    'Cstm'
                  )
                )
              )
            ),
            _react2['default'].createElement(
              _reactNative.View,
              { style: styles.halfInput },
              _react2['default'].createElement(
                _reactNative.Text,
                { style: styles.label },
                'Overs'
              ),
              _react2['default'].createElement(_reactNative.TextInput, { style: styles.input, value: overs, onChangeText: setOvers, keyboardType: 'numeric' })
            )
          )
        ),
        _react2['default'].createElement(
          _expoBlur.BlurView,
          { intensity: 40, tint: 'dark', style: styles.section },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.sectionTitle },
            'THE TOSS'
          ),
          _react2['default'].createElement(
            _reactNative.View,
            { style: styles.inputRow },
            _react2['default'].createElement(
              _reactNative.View,
              { style: styles.halfInput },
              _react2['default'].createElement(
                _reactNative.Text,
                { style: styles.label },
                'Toss Won By'
              ),
              _react2['default'].createElement(
                _reactNative.View,
                { style: styles.toggleGroup },
                _react2['default'].createElement(
                  _reactNative.TouchableOpacity,
                  { style: [styles.toggleBtn, tossWinner === 'Team A' && styles.toggleActive], onPress: function () {
                      return setTossWinner('Team A');
                    } },
                  _react2['default'].createElement(
                    _reactNative.Text,
                    { style: [styles.toggleText, tossWinner === 'Team A' && styles.toggleTextActive] },
                    'Team A'
                  )
                ),
                _react2['default'].createElement(
                  _reactNative.TouchableOpacity,
                  { style: [styles.toggleBtn, tossWinner === 'Team B' && styles.toggleActive], onPress: function () {
                      return setTossWinner('Team B');
                    } },
                  _react2['default'].createElement(
                    _reactNative.Text,
                    { style: [styles.toggleText, tossWinner === 'Team B' && styles.toggleTextActive] },
                    'Team B'
                  )
                )
              )
            ),
            _react2['default'].createElement(
              _reactNative.View,
              { style: styles.halfInput },
              _react2['default'].createElement(
                _reactNative.Text,
                { style: styles.label },
                'Decision'
              ),
              _react2['default'].createElement(
                _reactNative.View,
                { style: styles.toggleGroup },
                _react2['default'].createElement(
                  _reactNative.TouchableOpacity,
                  { style: [styles.toggleBtn, tossDecision === 'BAT' && styles.toggleActive], onPress: function () {
                      return setTossDecision('BAT');
                    } },
                  _react2['default'].createElement(
                    _reactNative.Text,
                    { style: [styles.toggleText, tossDecision === 'BAT' && styles.toggleTextActive] },
                    'BAT'
                  )
                ),
                _react2['default'].createElement(
                  _reactNative.TouchableOpacity,
                  { style: [styles.toggleBtn, tossDecision === 'BOWL' && styles.toggleActive], onPress: function () {
                      return setTossDecision('BOWL');
                    } },
                  _react2['default'].createElement(
                    _reactNative.Text,
                    { style: [styles.toggleText, tossDecision === 'BOWL' && styles.toggleTextActive] },
                    'BOWL'
                  )
                )
              )
            )
          ),
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.tossSummary },
            battingTeamName,
            ' will bat first.'
          )
        ),
        _react2['default'].createElement(
          _expoBlur.BlurView,
          { intensity: 40, tint: 'dark', style: styles.section },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.sectionTitle },
            'OPENING BATSMEN'
          ),
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.subLabel },
            'Select from ',
            battingTeamName,
            ' roster:'
          ),
          _react2['default'].createElement(
            _reactNative.View,
            { style: styles.rosterSelection },
            battingRoster.map(function (player, idx) {
              return _react2['default'].createElement(
                _reactNative.TouchableOpacity,
                {
                  key: idx,
                  style: [styles.rosterPill, striker === player && styles.strikerPill, nonStriker === player && styles.nonStrikerPill],
                  onPress: function () {
                    if (striker === player) setStriker('');else if (nonStriker === player) setNonStriker('');else if (!striker) setStriker(player);else if (!nonStriker) setNonStriker(player);
                  }
                },
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: styles.rosterPillText },
                  player
                ),
                striker === player && _react2['default'].createElement(
                  _reactNative.Text,
                  { style: styles.pillBadge },
                  'ST'
                ),
                nonStriker === player && _react2['default'].createElement(
                  _reactNative.Text,
                  { style: styles.pillBadge },
                  'NS'
                )
              );
            })
          )
        )
      ),
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.bottomBar },
        _react2['default'].createElement(
          _reactNative.TouchableOpacity,
          { style: styles.startBtn, onPress: handleStart },
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.startBtnText },
            'START MATCH'
          )
        )
      )
    )
  );
}

var styles = _reactNative.StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { color: '#00e676', fontSize: 24, fontWeight: '900', marginLeft: 15, letterSpacing: 1 },

  content: { flex: 1, padding: 15 },

  section: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },

  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  halfInput: { flex: 1 },
  vsText: { color: '#888', fontWeight: 'bold', marginHorizontal: 15, marginTop: 25 },

  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8, fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#333' },

  toggleGroup: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 3, borderWidth: 1, borderColor: '#333' },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleActive: { backgroundColor: '#00e676' },
  toggleText: { color: '#888', fontWeight: 'bold' },
  toggleTextActive: { color: '#000' },

  tossSummary: { color: '#00e676', textAlign: 'center', marginTop: 10, fontWeight: 'bold' },

  subLabel: { color: '#888', fontSize: 12, marginBottom: 15 },
  rosterSelection: { flexDirection: 'row', flexWrap: 'wrap' },
  rosterPill: { backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, marginRight: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  rosterPillText: { color: '#fff' },
  strikerPill: { backgroundColor: '#ff1744', borderColor: '#ff1744' },
  nonStrikerPill: { backgroundColor: '#2979ff', borderColor: '#2979ff' },
  pillBadge: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 5, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },

  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  startBtn: { backgroundColor: '#00e676', paddingVertical: 18, borderRadius: 30, alignItems: 'center', shadowColor: '#00e676', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  startBtnText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});
module.exports = exports['default'];