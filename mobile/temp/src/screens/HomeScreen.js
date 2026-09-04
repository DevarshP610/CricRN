'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports['default'] = HomeScreen;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactNative = require('react-native');

var _lucideReactNative = require('lucide-react-native');

var _reactNativeAsyncStorageAsyncStorage = require('@react-native-async-storage/async-storage');

var _reactNativeAsyncStorageAsyncStorage2 = _interopRequireDefault(_reactNativeAsyncStorageAsyncStorage);

var _reactNavigationNative = require('@react-navigation/native');

var _expoBlur = require('expo-blur');

var _expoLinearGradient = require('expo-linear-gradient');

var _Dimensions$get = _reactNative.Dimensions.get('window');

var width = _Dimensions$get.width;

function HomeScreen(_ref) {
  var _this = this;

  var navigation = _ref.navigation;

  var _React$useState = _react2['default'].useState(null);

  var _React$useState2 = _slicedToArray(_React$useState, 2);

  var recentMatch = _React$useState2[0];
  var setRecentMatch = _React$useState2[1];

  (0, _reactNavigationNative.useFocusEffect)(_react2['default'].useCallback(function () {
    var fetchMatches = function fetchMatches() {
      var stored, parsed;
      return regeneratorRuntime.async(function fetchMatches$(context$3$0) {
        while (1) switch (context$3$0.prev = context$3$0.next) {
          case 0:
            context$3$0.prev = 0;
            context$3$0.next = 3;
            return regeneratorRuntime.awrap(_reactNativeAsyncStorageAsyncStorage2['default'].getItem('saved_matches'));

          case 3:
            stored = context$3$0.sent;

            if (stored) {
              parsed = JSON.parse(stored);

              if (parsed.length > 0) {
                setRecentMatch(parsed[0]);
              }
            }
            context$3$0.next = 10;
            break;

          case 7:
            context$3$0.prev = 7;
            context$3$0.t0 = context$3$0['catch'](0);

            console.log(context$3$0.t0);

          case 10:
          case 'end':
            return context$3$0.stop();
        }
      }, null, _this, [[0, 7]]);
    };
    fetchMatches();
  }, []));

  return _react2['default'].createElement(
    _expoLinearGradient.LinearGradient,
    { colors: ['#0a192f', '#020c1b'], style: styles.container },
    _react2['default'].createElement(_reactNative.StatusBar, { barStyle: 'light-content' }),
    _react2['default'].createElement(
      _reactNative.SafeAreaView,
      { style: { flex: 1 } },
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.header },
        _react2['default'].createElement(
          _reactNative.View,
          null,
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.greeting },
            'Welcome Back,'
          ),
          _react2['default'].createElement(
            _reactNative.Text,
            { style: styles.coachName },
            'Coach Devarsh'
          )
        ),
        _react2['default'].createElement(
          _reactNative.TouchableOpacity,
          { style: styles.profileBtn, onPress: function () {
              return navigation.navigate('PlayerProfile');
            } },
          _react2['default'].createElement(_lucideReactNative.User, { color: '#000', size: 24 })
        )
      ),
      _react2['default'].createElement(
        _reactNative.View,
        { style: styles.content },
        _react2['default'].createElement(
          _reactNative.View,
          { style: styles.statsRow },
          _react2['default'].createElement(
            _expoBlur.BlurView,
            { intensity: 40, tint: 'dark', style: styles.statBox },
            _react2['default'].createElement(
              _reactNative.Text,
              { style: styles.statNumber },
              '12'
            ),
            _react2['default'].createElement(
              _reactNative.Text,
              { style: styles.statLabel },
              'Matches'
            )
          ),
          _react2['default'].createElement(
            _expoBlur.BlurView,
            { intensity: 40, tint: 'dark', style: styles.statBox },
            _react2['default'].createElement(
              _reactNative.Text,
              { style: styles.statNumber },
              '482'
            ),
            _react2['default'].createElement(
              _reactNative.Text,
              { style: styles.statLabel },
              'Clips Saved'
            )
          )
        ),
        _react2['default'].createElement(
          _reactNative.View,
          { style: styles.actionCenter },
          _react2['default'].createElement(
            _reactNative.TouchableOpacity,
            { onPress: function () {
                return navigation.navigate('MatchSetup');
              }, style: styles.touchableWrapper },
            _react2['default'].createElement(
              _expoBlur.BlurView,
              { intensity: 60, tint: 'light', style: [styles.mainActionBtn, { borderColor: 'rgba(0, 230, 118, 0.4)' }] },
              _react2['default'].createElement(
                _reactNative.View,
                { style: [styles.iconBox, { backgroundColor: '#00e676' }] },
                _react2['default'].createElement(_lucideReactNative.Trophy, { color: '#000', size: 28, fill: '#000' })
              ),
              _react2['default'].createElement(
                _reactNative.View,
                { style: styles.btnTextContainer },
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: [styles.mainActionText, { color: '#fff' }] },
                  'START MATCH'
                ),
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: [styles.subActionText, { color: 'rgba(255,255,255,0.7)' }] },
                  'Full Scoring & Teams'
                )
              )
            )
          ),
          _react2['default'].createElement(
            _reactNative.TouchableOpacity,
            { onPress: function () {
                return navigation.navigate('LiveCamera', { sessionType: 'PRACTICE' });
              }, style: styles.touchableWrapper },
            _react2['default'].createElement(
              _expoBlur.BlurView,
              { intensity: 50, tint: 'dark', style: [styles.mainActionBtn, { borderColor: 'rgba(41, 121, 255, 0.4)' }] },
              _react2['default'].createElement(
                _reactNative.View,
                { style: [styles.iconBox, { backgroundColor: '#2979ff' }] },
                _react2['default'].createElement(_lucideReactNative.Play, { color: '#fff', size: 28, fill: '#fff' })
              ),
              _react2['default'].createElement(
                _reactNative.View,
                { style: styles.btnTextContainer },
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: [styles.mainActionText, { color: '#fff' }] },
                  'PRACTICE SESSION'
                ),
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: [styles.subActionText, { color: 'rgba(255,255,255,0.7)' }] },
                  'Continuous Clip Recording'
                )
              )
            )
          ),
          recentMatch && _react2['default'].createElement(
            _reactNative.TouchableOpacity,
            { style: styles.touchableWrapper, onPress: function () {
                return navigation.navigate('LiveCamera', {
                  isResume: true,
                  savedMatchId: recentMatch.id,
                  sessionType: recentMatch.sessionType,
                  matchDetails: recentMatch.matchDetails,
                  score: recentMatch.score,
                  innings: recentMatch.innings,
                  battingTeam: recentMatch.battingTeam,
                  bowlingTeam: recentMatch.bowlingTeam,
                  activeStriker: recentMatch.activeStriker,
                  strikerName: recentMatch.strikerName,
                  nonStrikerName: recentMatch.nonStrikerName,
                  yetToBat: recentMatch.yetToBat,
                  targetScore: recentMatch.targetScore
                });
              } },
            _react2['default'].createElement(
              _expoBlur.BlurView,
              { intensity: 50, tint: 'dark', style: [styles.mainActionBtn, { borderColor: 'rgba(255, 145, 0, 0.4)' }] },
              _react2['default'].createElement(
                _reactNative.View,
                { style: [styles.iconBox, { backgroundColor: '#ff9100' }] },
                _react2['default'].createElement(_lucideReactNative.Clock, { color: '#fff', size: 28 })
              ),
              _react2['default'].createElement(
                _reactNative.View,
                { style: styles.btnTextContainer },
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: [styles.mainActionText, { color: '#fff' }] },
                  'RESUME RECENT'
                ),
                _react2['default'].createElement(
                  _reactNative.Text,
                  { style: [styles.subActionText, { color: 'rgba(255,255,255,0.7)' }] },
                  recentMatch.score.runs,
                  '-',
                  recentMatch.score.wickets,
                  ' (',
                  Math.floor(recentMatch.score.balls / 6),
                  '.',
                  recentMatch.score.balls % 6,
                  ')'
                )
              )
            )
          )
        )
      )
    )
  );
}

var styles = _reactNative.StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  coachName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  profileBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#00e676', justifyContent: 'center', alignItems: 'center', shadowColor: '#00e676', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },

  content: { flex: 1, padding: 24 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  statBox: { width: '48%', padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  statNumber: { color: '#00e676', fontSize: 32, fontWeight: '900', textShadowColor: 'rgba(0, 230, 118, 0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, fontWeight: '600' },

  actionCenter: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  touchableWrapper: { width: '100%', marginBottom: 20 },
  mainActionBtn: { flexDirection: 'row', width: '100%', paddingVertical: 20, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
  btnTextContainer: { marginLeft: 20 },
  mainActionText: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  subActionText: { fontSize: 13, fontWeight: '600', marginTop: 4 }
});
module.exports = exports['default'];