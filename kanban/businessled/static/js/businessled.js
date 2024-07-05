//abbreviateNumber
var SI_SYMBOL = ["", "k", "M", "B", "T", "Q"];
function abbreviateNumber(num) {
    var tier = Math.log10(Math.abs(num)) / 3 | 0;
    if (tier == 0) return num.toFixed(1);
    var suffix = SI_SYMBOL[tier];
    var scale = Math.pow(10, tier * 3);
    var scaled = num / scale;
    return scaled.toFixed(1) + suffix;
}

function abbreviateGrowth(num) {
    return num + ' %';
}

function paramabbreviateNumber(cell, formatterParams) {
    var value = cell.getValue();
    return abbreviateNumber(value);
}

function paramLookupGrowth(cell, formatterParams) {
    var value = cell.getValue();
    if (value > 0) {
        return "<span style='color:#3FB449; font-weight:bold;'>" + abbreviateNumber(value) + "% </span>";
    }
    else {
        return "<span style='color:#880808; font-weight:bold;'>" + abbreviateNumber(value) + "% </span>";;
    }
}

function showhideElemnts(boxy1, boxy2, btny1, btny2) {
    const box1 = document.getElementById(boxy1);
    const box2 = document.getElementById(boxy2);
    const btn1 = document.getElementById(btny1);
    const btn2 = document.getElementById(btny2);
    btn1.addEventListener('click', function handleClick1() {
        box2.style.display = 'none'
        box1.style.display = 'block'
    });
    btn2.addEventListener('click', function handleClick2() {
        box1.style.display = 'none'
        box2.style.display = 'block'
    })
};

//////////////////////
//Caclulated Metrics//
/////////////////////

function slRevenueGrowth(value, data) {
    return (data.SLREVENUE - data.SLREVENUE_LY) / data.SLREVENUE_LY * 100;
}

function slRevenueGrowthTotal(values, data) {
    rev = 0
    revly = 0
    data.forEach(function (x, i) {
        rev = (x.SLREVENUE || 0) + rev;
        revly = (x.SLREVENUE_LY || 0) + revly

    });

    return (rev - revly) / revly * 100;
}

