$('.date').each(function(){
  $(this).text(moment(parseInt($(this).text())).local().format('MM/DD'));
});
