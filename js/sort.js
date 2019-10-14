var sorting = (function() {

  var DEFAULT_COLOR = '#3F4A7E';
  var COMPARE_COLOR = '#1BEC81';
  var SWAP_COLOR = '#E57D42';
  var DEFAULT_COLOR2 = '#3D1657';
  
  function randint(low, high) {
    // Return a random integer in the range [low, high] inclusive.
    return low + Math.floor((high - low + 1) * Math.random());
  }

  function draw_array(canvas, ary, colors, colors2) {
    /*
     * Draw an array on a canvas.
     *
     * Inputs:
     * - canvas: a DOM canvas object
     * - ary: An array of numbers to draw
     * - colors: An array of the same length as ary, whose ith element
     *   is a string giving the color for the ith element of ary
     */
    var width_ratio = 2;
    var ctx = canvas.getContext('2d');


    // Clear the canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find min and max elements
    var min = ary[0];
    var max = ary[0];
    for (var i = 1; i < ary.length; i++) {
      min = ary[i] < min ? ary[i] : min;
      max = ary[i] > max ? ary[i] : max;
    }

    // Figure out width of bars and spacing
    var n = ary.length;
    var spacing = canvas.width / (width_ratio * n + n + 1);
    var bar_width = spacing * width_ratio;



    function convert_y(y) {
      // Want convert_y(max) = 0, convert_y(min) = canvas.height`
      var a = canvas.height / (min - max);
      var b = max * canvas.height / (max - min);
      return a * y + b;
    }

    // Draw a baseline for zero
    var y_zero = convert_y(1);
    ctx.beginPath();
    ctx.moveTo(0, y_zero);
    ctx.lineTo(canvas.width, y_zero);
    ctx.stroke();

    // Now draw boxes
    var x = spacing;
    for (var i = 0; i <= ary.length/2; i++) {
      ctx.fillStyle = colors[i];
      var y = convert_y(ary[i]);
      if (ary[i] >= 0) {
        ctx.fillRect(x, y, bar_width, y_zero - y);
      } else {
        ctx.fillRect(x, y_zero, bar_width, y - y_zero);
      }
      x += spacing + bar_width;
    }
    for (var i = ary.length/2; i < ary.length; i++) {
      ctx.fillStyle = colors[i];
      var y = convert_y(ary[i]);
      if (ary[i] >= 0) {
        ctx.fillRect(x, y, bar_width, y_zero - y);
      } else {
        ctx.fillRect(x, y_zero, bar_width, y - y_zero);
      }
      x += spacing + bar_width;
    }
  }


  function AnimatedArray(ary, canvas, interval) {

    this._ary = ary;
    this._canvas = canvas;
    this._ary_display = [];
    this._colors = [];
    this._colors2 = [];
    this._actions = [];

    for (var i = 0; i < ary.length; i++) {
      this._ary_display.push(ary[i]);
      this._colors.push(DEFAULT_COLOR);
      this._colors2.push(DEFAULT_COLOR2);
    }
    draw_array(this._canvas, this._ary, this._colors,this._colors2);

    var _this = this;
    this._id = window.setInterval(function() {_this._step();}, interval);
  }

  AnimatedArray.prototype.cancel = function() {
    /*
     * Cancel animations for any pending actions for this AnimatedArray.
     */
    window.clearInterval(this._id);
  }

  AnimatedArray.prototype.compare = function(i, j) {
    /*
     * Compare the elements at indices i and j.
     *
     * this.compare(i, j) > 0 iff this._ary[i] > this._ary[j].
     */
    this._actions.push(['compare', i, j]);
    return this._ary[i] - this._ary[j];
  }

  AnimatedArray.prototype.lessThan = function(i, j) {
    /*
     * Check whether this._ary[i] is less than this._ary[j].
     */
    return this.compare(i, j) < 0;
  }

  AnimatedArray.prototype.swap = function(i, j) {
    /*
     * Swap this._ary[i] and this._ary[j].
     */
    this._actions.push(['swap', i, j]);
    var temp = this._ary[i];
    this._ary[i] = this._ary[j];
    this._ary[j] = temp;
  }

  AnimatedArray.prototype._step = function() {
    /*
     * Consumes one step from the action buffer, using it to update
     * the display version of the array and the color array; then
     * draws the display array to the canvas. You should not call this
     * manually.
     */
    if (this._actions.length === 0) {
      draw_array(this._canvas, this._ary_display, this._colors, this._colors2);
      return;
    }
    var action = this._actions.shift();
    var i = action[1];
    var j = action[2];
    if (action[0] === 'compare') {
      this._colors[i] = COMPARE_COLOR;
      this._colors[j] = COMPARE_COLOR;
    } else if (action[0] === 'swap') {
      this._colors[i] = SWAP_COLOR;
      this._colors[j] = SWAP_COLOR;
      var temp = this._ary_display[i];
      this._ary_display[i] = this._ary_display[j];
      this._ary_display[j] = temp;
    }
    draw_array(this._canvas, this._ary_display, this._colors, this._colors2);
      this._colors[i] = DEFAULT_COLOR;
      this._colors[j] = DEFAULT_COLOR;
  }

  AnimatedArray.prototype.length = function() {
    return this._ary.length;
  }


  function bubblesort(array) {
    var n = array.length();
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n - i - 1; j++) {
        if (array.lessThan(j + 1, j)) {
          array.swap(j, j + 1);
        }
      }
    }
  }


  function selectionsort(array) {
    var n = array.length()-1;
    for (var i = 0; i < n; i++) {
      var min = i;
      for (var j = i; j < n; j++) {
        if (array.lessThan(j, min)) {min = j;}
      }
      array.swap(i, min);
    }
  }


  function insertionsort(array) {
    var n = array.length();
    for (var i = 1; i < n; i++) {
      for (var j = i; j > 0 && array.lessThan(j, j - 1); j--) {
        array.swap(j, j - 1);
      }
    }
  }



  function partition(array,left, right) {
    var pivot = Math.round((left + right) / 2);
    array.swap(pivot, right);

    // Partition the array around the pivot.
    pivot = left;
    for (var i = left; i < right; i++) {
      if (array.lessThan(i, right)) {
        if (i != pivot) {
          array.swap(i, pivot);
        }
        pivot += 1
      }
    }
    array.swap(right, pivot);

    return pivot;
  }

  function quicksort(array, left, right) {
    var n = array.length();
    if (typeof(left) === 'undefined') left = 0;
    if (typeof(right) === 'undefined') right = n - 1;

    if (left >= right) return;

    var pivot = partition(array, left, right);
    quicksort(array,left, pivot - 1);
    quicksort(array, pivot + 1, right);
  }



  function check_perm(perm) {
    // Check to see if an array is a valid permutation.
    var n = perm.length;
    var used = {};
    for (var i = 0; i < n; i++) {
      if (used[perm[i]]) return false;
      used[perm[i]] = true;
    }
    for (var i = 0; i < n; i++){
      if (!used[i]){
        return false;
      }
    }
    return true;
  }


  function perm_to_swaps(perm) {
    /*
     *  Convert a permutation to a sequence of transpositions.
     *  
     *  We represent a general permutation as a list of length N
     *  where each element is an integer from 0 to N - 1, with the
     *  interpretation that the element at index i will move to index
     *  perm[i].
     *
     *  In general any permutation can be written as a product of
     *  transpositions; we represent the transpostions as an array t of
     *  length-2 arrays, with the interpretation that we first swap
     *  t[0][0] with t[0][1], then swap t[1][0] with t[1][1], etc.
     *
     *  Input: perm, a permutation
     *  Returns: transpositions: a list of transpositions.
     */
    if (!check_perm(perm)) {
      console.log(perm);
      throw "Invalid permutation";
    }
    var n = perm.length;
    var used = [];
    for (var i = 0; i < n; i++) used.push(false);
    var transpositions = [];

    for (var i = 0; i < n; i++) {
      if (used[i]) continue;
      let cur = i;
      if (perm[i] == i) used[i] = true;
      while (!used[perm[cur]]) {
        transpositions.push([cur, perm[cur]]);
        used[cur] = true;
        cur = perm[cur];
      }
    }

    return transpositions;
  }


  function mergesort(array, left, right) {
    if (typeof(left) === 'undefined') left = 0;
    if (typeof(right) === 'undefined') right = array.length() - 1;

    if (left >= right) return;

    var mid = Math.floor(left+(right-left)/2);

    if (right - left > 1) {
      mergesort(array, left, mid);
      mergesort(array, mid + 1, right);
    }

    // Merge, building up a permutation. This could probably be prettier.
    var next_left = left;
    var next_right = mid + 1;
    var perm = [];
    for (var i = left; i <= right; i++) {
      var choice = null;
      if (next_left <= mid && next_right <= right) {
        if (array.lessThan(next_left, next_right)) {
          choice = 'L';
        } else {
          choice = 'R';
        }
      } else if (next_left > mid) {
        choice = 'R';
      } else if (next_right > right) {
        choice = 'L';
      }
      if (choice === 'L') {
        perm.push(next_left - left);
        next_left++;
      } else if (choice === 'R') {
        perm.push(next_right - left);
        next_right++;
      } else {
        throw 'Should not get here'
      }
    }

    var swaps = perm_to_swaps(perm);
    for (var i = 0; i < swaps.length; i++) {
      array.swap(swaps[i][0] + left, swaps[i][1] + left);
    }
  }

  function heapsort(array, left, right) {
    if (typeof(left) === 'undefined') left = 0;
    if (typeof(right) === 'undefined') right = array.length() - 1;
    var n = right - left + 1;

    function percolate_down(start, end) {
      var root = start;
      while (true) {
        var left_child = 2 * (root - left) + 1 + left;
        var right_child = 2 * (root - left) + 2 + left;
        if (left_child > end) break;

        var swap = root;
        if (array.lessThan(swap, left_child)) {
          swap = left_child;
        }
        if (right_child <= end && array.lessThan(swap, right_child)) {
          swap = right_child;
        }
        if (swap === root) {
          return;
        }
        array.swap(root, swap);
        root = swap;
      }
    }

    // First build a heap
    var start = Math.floor(n / 2) - 1 + left;
    while (start >= left) {
      percolate_down(start, right);
      start--;
    }

    // Now pop elements one by one, rebuilding the heap after each
    var end = right;
    while (end > left) {
      array.swap(end, left);
      end--;
      percolate_down(left, end);
    }
  }


  var algorithms = {
    'bubblesort': bubblesort,
    'selectionsort': selectionsort,
    'insertionsort': insertionsort,
    'heapsort': heapsort,
    'quicksort': quicksort,
    'mergesort': mergesort,
  }
  function currentAlgo(algo){
    if(algorithms.hasOwnProperty(algo)){

    }
  }

  function is_pivot_algo(algo) {
    var pivot_algos = {
      'quicksort': true,
    };
    return pivot_algos.hasOwnProperty(algo);
  }

  function get_sort_fn(algo) {
    if (!algorithms.hasOwnProperty(algo)) {
      throw 'Invalid algorithm ' + algo;
    }
    var sort_fn = algorithms[algo];
    if (is_pivot_algo(algo)) {
      return function(array) { sort_fn(array); };
    } else {
      return sort_fn;
    }
  }

  return {
    'AnimatedArray': AnimatedArray,
    'get_sort_fn': get_sort_fn,
    'is_pivot_algo': is_pivot_algo,
    'algorithms': algorithms,
  }

  return _sorting;

})();
