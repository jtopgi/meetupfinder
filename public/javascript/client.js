$('.input-daterange').datepicker({
    format: "yyyy-mm-dd",
    autoclose: true,
    todayHighlight: true
});

$('.date').each(function(){
  $(this).text(moment(parseInt($(this).text())).local().format('MM/DD'));
});
